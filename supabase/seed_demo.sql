-- Demo seed for client presentation (idempotent).
-- Emails: demo.cliente01@iplanetpay.demo … demo.cliente20@iplanetpay.demo
-- Password (all): DemoCliente123!
-- Re-run safe: deletes prior *@iplanetpay.demo users (cascades related rows).


do $$
declare
  v_pwd text := extensions.crypt('DemoCliente123!', extensions.gen_salt('bf'));
  v_instance uuid := '00000000-0000-0000-0000-000000000000';
  v_store_ids uuid[];
  v_product_ids uuid[];
  v_product_prices int[];
  v_user_ids uuid[] := array[]::uuid[];
  v_uid uuid;
  v_email text;
  v_name text;
  v_phone text;
  v_i int;
  v_j int;
  v_store uuid;
  v_prod uuid;
  v_price int;
  v_status reservation_status;
  v_paid int;
  v_res_id uuid;
  v_n_contrib int;
  v_chunk int;
  v_remain int;
  v_amt int;
  v_conf timestamptz;
  v_contrib_id uuid;
  v_pix_id text;
  v_goal_id uuid;
  v_names text[] := array[
    'Ana Beatriz Oliveira',
    'Bruno Henrique Costa',
    'Camila Ferreira Santos',
    'Diego Almeida Souza',
    'Eduarda Martins Lima',
    'Felipe Rocha Nunes',
    'Gabriela Mendes Pinto',
    'Henrique Barbosa Silva',
    'Isabela Carvalho Dias',
    'João Pedro Araujo',
    'Karina Lopes Teixeira',
    'Lucas Gabriel Moreira',
    'Mariana Souza Ribeiro',
    'Nicolas Pereira Castro',
    'Olivia Fernandes Cruz',
    'Pedro Henrique Gomes',
    'Quezia Andrade Freitas',
    'Rafael Vieira Monteiro',
    'Sofia Campos Batista',
    'Thiago Nascimento Melo'
  ];
  v_statuses reservation_status[] := array[
    'ativa','ativa','ativa','ativa','ativa',
    'ativa','ativa','ativa','ativa','ativa',
    'quitada','quitada','quitada','quitada',
    'retirada','retirada',
    'cancelada','cancelada',
    'saque_pendente',
    'ativa'
  ];
  -- second reservation for clients 1,5,9,14 (indices 1-based)
  v_extra int[] := array[1,5,9,14];
  v_extra_status reservation_status := 'ativa';
  v_ref_pairs int[][] := array[[1,2],[3,4],[5,6],[7,8],[9,10]];
  v_referrer uuid;
  v_referred uuid;
  v_ref_id uuid;
begin
  -- Cleanup previous demo users (cascade profiles/reservations/etc.)
  delete from auth.users where email ilike '%@iplanetpay.demo';

  select array_agg(id order by name) into v_store_ids from public.stores;
  if v_store_ids is null or array_length(v_store_ids, 1) < 1 then
    raise exception 'No stores found';
  end if;

  select array_agg(id order by list_price_cents), array_agg(list_price_cents order by list_price_cents)
    into v_product_ids, v_product_prices
  from (
    select id, list_price_cents
    from public.products
    where active = true
    order by list_price_cents
    limit 28
  ) p;

  if v_product_ids is null or array_length(v_product_ids, 1) < 5 then
    raise exception 'Not enough active products';
  end if;

  for v_i in 1..20 loop
    v_uid := gen_random_uuid();

    v_email := 'demo.cliente' || lpad(v_i::text, 2, '0') || '@iplanetpay.demo';
    v_name := v_names[v_i];
    v_phone := '11' || lpad((900000000 + v_i * 137 + 42)::text, 9, '0');
    -- keep phone length 11
    v_phone := '119' || lpad((70000000 + v_i * 135791 + 2468)::text, 8, '0');
    v_phone := substr(v_phone, 1, 11);

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, is_sso_user, is_anonymous
    ) values (
      v_instance, v_uid, 'authenticated', 'authenticated', v_email, v_pwd,
      now() - ((20 - v_i) || ' days')::interval,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', v_uid::text,
        'email', v_email,
        'full_name', v_name,
        'phone', v_phone,
        'email_verified', true,
        'phone_verified', false
      ),
      now() - ((20 - v_i) || ' days')::interval,
      now(),
      '', '', '', '',
      false, false
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid,
      jsonb_build_object(
        'sub', v_uid::text,
        'email', v_email,
        'full_name', v_name,
        'phone', v_phone,
        'email_verified', true,
        'phone_verified', false
      ),
      'email', v_uid::text,
      now() - ((10 - (v_i % 10)) || ' days')::interval,
      now() - ((20 - v_i) || ' days')::interval,
      now()
    );

    -- trigger created profile; enrich terms + ensure name/phone
    update public.profiles
    set
      full_name = v_name,
      phone = v_phone,
      role = 'cliente',
      terms_accepted_at = now() - ((18 - v_i) || ' days')::interval,
      terms_version = 'withdrawal-v1'
    where id = v_uid;

    v_user_ids := array_append(v_user_ids, v_uid);
  end loop;

  -- Create reservations + contributions for each client
  for v_i in 1..20 loop
    v_uid := v_user_ids[v_i];
    v_status := v_statuses[v_i];
    v_name := v_names[v_i];
    select phone into v_phone from public.profiles where id = v_uid;
    v_store := v_store_ids[1 + ((v_i - 1) % array_length(v_store_ids, 1))];
    v_prod := v_product_ids[1 + ((v_i * 3) % array_length(v_product_ids, 1))];
    v_price := v_product_prices[1 + ((v_i * 3) % array_length(v_product_prices, 1))];

    -- paid amount by status
    if v_status = 'cancelada' then
      v_paid := 0;
      v_n_contrib := 0;
    elsif v_status in ('quitada', 'retirada', 'saque_pendente') then
      v_paid := v_price;
      v_n_contrib := 3 + (v_i % 4); -- 3..6
    else -- ativa partial
      v_paid := greatest(5000, (v_price * (25 + (v_i * 7) % 55) / 100));
      v_paid := least(v_paid, v_price - 10000);
      if v_paid < 5000 then v_paid := least(v_price / 4, v_price - 1000); end if;
      v_n_contrib := 2 + (v_i % 5); -- 2..6
    end if;

    insert into public.reservations (
      id, user_id, product_id, store_id, status,
      list_price_cents, amount_paid_cents, notes, created_at, updated_at,
      cancel_reason
    ) values (
      gen_random_uuid(), v_uid, v_prod, v_store, v_status,
      v_price, 0, -- paid filled after contribs
      'Demo seed',
      now() - ((55 - v_i) || ' days')::interval,
      now() - ((3 + (v_i % 5)) || ' days')::interval,
      case when v_status = 'cancelada' then 'Cliente desistiu (demo)' else null end
    ) returning id into v_res_id;

    -- contributions
    if v_n_contrib > 0 and v_paid > 0 then
      v_remain := v_paid;
      for v_j in 1..v_n_contrib loop
        if v_j = v_n_contrib then
          v_amt := v_remain;
        else
          v_chunk := greatest(1000, v_remain / (v_n_contrib - v_j + 1));
          -- slight variance
          v_amt := greatest(1000, least(v_remain - (v_n_contrib - v_j) * 1000, v_chunk + ((v_i + v_j) % 7) * 500));
          v_remain := v_remain - v_amt;
        end if;
        if v_amt <= 0 then continue; end if;

        v_conf := now() - ((60 - v_i * 2 - v_j * 3) || ' days')::interval
                  - ((v_j * 5) || ' hours')::interval;
        v_pix_id := 'demo-pix-' || v_i::text || '-' || v_j::text || '-' || substr(md5(v_res_id::text || v_j::text), 1, 10);

        insert into public.contributions (
          id, user_id, reservation_id, amount_cents, payment_method, status,
          gateway_provider, gateway_payment_id, confirmed_at, created_at, updated_at
        ) values (
          gen_random_uuid(), v_uid, v_res_id, v_amt, 'pix', 'confirmed',
          'demo', v_pix_id, v_conf, v_conf - interval '2 minutes', v_conf
        ) returning id into v_contrib_id;

        insert into public.wallet_ledger (
          user_id, reservation_id, contribution_id, entry_type, amount_cents, memo, created_at
        ) values (
          v_uid, v_res_id, v_contrib_id, 'aporte', v_amt,
          'Aporte Pix (demo)', v_conf
        );
      end loop;

      update public.reservations
      set amount_paid_cents = (
        select coalesce(sum(amount_cents), 0)
        from public.contributions
        where reservation_id = v_res_id and status = 'confirmed'
      )
      where id = v_res_id;
    end if;

    -- payment goals for some ativa/quitada
    if v_status in ('ativa', 'quitada') and v_i % 3 = 1 then
      insert into public.payment_goals (
        user_id, product_id, reservation_id, name, target_date,
        amount_cents, installment_cents, installments_count, status,
        whatsapp_phone, reminder_day, created_at
      ) values (
        v_uid, v_prod, v_res_id,
        'Meta ' || split_part(v_names[v_i], ' ', 1),
        (current_date + ((30 + v_i) || ' days')::interval)::date,
        v_price,
        greatest(10000, v_price / 6),
        6,
        case when v_status = 'quitada' then 'done' else 'active' end,
        v_phone,
        5 + (v_i % 20),
        now() - ((40 - v_i) || ' days')::interval
      );
    end if;
  end loop;

  -- Extra reservations for a few clients
  foreach v_i in array v_extra loop
    v_uid := v_user_ids[v_i];
    v_store := v_store_ids[1 + (v_i % array_length(v_store_ids, 1))];
    v_prod := v_product_ids[1 + ((v_i * 5 + 2) % array_length(v_product_ids, 1))];
    v_price := v_product_prices[1 + ((v_i * 5 + 2) % array_length(v_product_prices, 1))];
    v_paid := greatest(8000, v_price * 35 / 100);
    v_n_contrib := 3;

    insert into public.reservations (
      user_id, product_id, store_id, status,
      list_price_cents, amount_paid_cents, notes, created_at, updated_at
    ) values (
      v_uid, v_prod, v_store, v_extra_status,
      v_price, 0, 'Demo seed (2ª reserva)',
      now() - ((25 - v_i) || ' days')::interval,
      now() - ((2 + v_i % 3) || ' days')::interval
    ) returning id into v_res_id;

    v_remain := v_paid;
    for v_j in 1..v_n_contrib loop
      if v_j = v_n_contrib then v_amt := v_remain;
      else
        v_amt := greatest(2000, v_remain / (v_n_contrib - v_j + 1));
        v_remain := v_remain - v_amt;
      end if;
      v_conf := now() - ((20 - v_j * 4) || ' days')::interval;
      v_pix_id := 'demo-pix-x' || v_i::text || '-' || v_j::text || '-' || substr(md5(v_res_id::text || 'x' || v_j::text), 1, 8);

      insert into public.contributions (
        user_id, reservation_id, amount_cents, payment_method, status,
        gateway_provider, gateway_payment_id, confirmed_at, created_at, updated_at
      ) values (
        v_uid, v_res_id, v_amt, 'pix', 'confirmed',
        'demo', v_pix_id, v_conf, v_conf, v_conf
      ) returning id into v_contrib_id;

      insert into public.wallet_ledger (
        user_id, reservation_id, contribution_id, entry_type, amount_cents, memo, created_at
      ) values (
        v_uid, v_res_id, v_contrib_id, 'aporte', v_amt, 'Aporte Pix (demo)', v_conf
      );
    end loop;

    update public.reservations
    set amount_paid_cents = (
      select coalesce(sum(amount_cents), 0) from public.contributions
      where reservation_id = v_res_id and status = 'confirmed'
    )
    where id = v_res_id;
  end loop;

  -- Referrals between demo clients (5 pairs)
  for v_i in 1..array_length(v_ref_pairs, 1) loop
    v_referrer := v_user_ids[v_ref_pairs[v_i][1]];
    v_referred := v_user_ids[v_ref_pairs[v_i][2]];

    update public.profiles set referred_by = v_referrer where id = v_referred;

    insert into public.referrals (
      referrer_id, referred_id, status, bonus_amount_cents, bonus_credited, credited_at, created_at
    ) values (
      v_referrer, v_referred,
      case when v_i <= 3 then 'completed' else 'pending' end,
      5000,
      v_i <= 3,
      case when v_i <= 3 then now() - ((12 - v_i) || ' days')::interval else null end,
      now() - ((30 - v_i * 3) || ' days')::interval
    ) returning id into v_ref_id;

    if v_i <= 3 then
      insert into public.wallet_ledger (
        user_id, entry_type, amount_cents, memo, referral_id, created_at
      ) values (
        v_referrer, 'ajuste', 5000,
        'Bônus indicação (demo)', v_ref_id,
        now() - ((12 - v_i) || ' days')::interval
      );
    end if;
  end loop;

  raise notice 'Demo seed OK: 20 clients created';
end $$;
