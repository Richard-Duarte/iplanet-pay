-- iPlanet Pay · confirm_retirada (device pickup, not refund)
-- Applied live as migration name: confirm_retirada_rpc
-- Business rule: quitada → retirada; stock already held at create; do NOT restore.

create or replace function public.confirm_retirada(
  p_reservation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_role public.user_role;
  v_partner_store uuid;
  v_res public.reservations%rowtype;
  v_updated integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  v_role := public.current_user_role();

  if v_role is distinct from 'staff'
     and v_role is distinct from 'admin'
     and v_role is distinct from 'parceiro' then
    raise exception 'Somente staff, admin ou parceiro podem confirmar retirada.';
  end if;

  select *
    into v_res
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  -- Parceiro: se profiles.store_id estiver preenchido, restringe à loja.
  -- Se store_id for null (vínculo ainda não configurado), permite como as
  -- policies de SELECT atuais — TODO: exigir store_id para todo parceiro.
  if v_role = 'parceiro' then
    select p.store_id into v_partner_store
    from public.profiles p
    where p.id = v_uid;

    if v_partner_store is not null and v_res.store_id is distinct from v_partner_store then
      raise exception 'Parceiro só pode confirmar retirada da própria loja.';
    end if;
  end if;

  if v_res.status <> 'quitada' then
    raise exception 'Só é possível confirmar retirada de reservas quitadas.';
  end if;

  update public.reservations
     set status = 'retirada'
   where id = p_reservation_id
     and status = 'quitada';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Só é possível confirmar retirada de reservas quitadas.';
  end if;

  -- Estoque NÃO é restaurado: o aparelho saiu da loja (já consumido no create_reservation).

  return p_reservation_id;
end;
$$;

revoke all on function public.confirm_retirada(uuid) from public;
revoke all on function public.confirm_retirada(uuid) from anon;
grant execute on function public.confirm_retirada(uuid) to authenticated;

comment on function public.confirm_retirada(uuid) is
  'Marca reserva quitada como retirada (pickup). Staff/admin/parceiro. Sem restore de estoque. Cliente não pode auto-marcar.';
