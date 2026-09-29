-- Cliente autenticado pode enviar oferta de usado (sem service_role na API).

create or replace function public.create_used_device_offer(
  p_offer_id uuid,
  p_reservation_id uuid,
  p_device_model text,
  p_imei text,
  p_expected_value_cents integer,
  p_minimum_value_cents integer,
  p_maintenance_options text[],
  p_liquid_exposure boolean,
  p_photo_paths text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_res public.reservations%rowtype;
  v_path text;
  v_prefix text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if p_offer_id is null then
    raise exception 'Identificador da oferta inválido.';
  end if;

  if coalesce(trim(p_device_model), '') = '' or coalesce(trim(p_imei), '') = '' then
    raise exception 'Preencha modelo e IMEI.';
  end if;

  if p_expected_value_cents is null or p_expected_value_cents <= 0
     or p_minimum_value_cents is null or p_minimum_value_cents <= 0 then
    raise exception 'Informe valores esperado e mínimo válidos.';
  end if;

  if p_minimum_value_cents > p_expected_value_cents then
    raise exception 'O valor mínimo não pode ser maior que o esperado.';
  end if;

  if p_maintenance_options is null or coalesce(array_length(p_maintenance_options, 1), 0) = 0 then
    raise exception 'Selecione ao menos uma opção de manutenção.';
  end if;

  if p_photo_paths is null or coalesce(array_length(p_photo_paths, 1), 0) = 0 then
    raise exception 'Envie ao menos uma foto do aparelho.';
  end if;

  v_prefix := v_uid::text || '/' || p_offer_id::text || '/';
  foreach v_path in array p_photo_paths loop
    if v_path is null or v_path !~ ('^' || v_prefix) then
      raise exception 'Caminho de foto inválido.';
    end if;
  end loop;

  select * into v_res
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  if v_res.user_id <> v_uid then
    raise exception 'Acesso negado.';
  end if;

  if v_res.status <> 'ativa' then
    raise exception 'Só reservas ativas aceitam oferta de usado.';
  end if;

  if exists (
    select 1
    from public.used_device_offers o
    where o.reservation_id = p_reservation_id
      and o.user_id = v_uid
      and o.status = 'pending'
  ) then
    raise exception 'Você já tem uma solicitação pendente de avaliação.';
  end if;

  insert into public.used_device_offers (
    id,
    user_id,
    reservation_id,
    device_model,
    imei,
    expected_value_cents,
    minimum_value_cents,
    maintenance_options,
    liquid_exposure,
    photo_paths,
    status
  ) values (
    p_offer_id,
    v_uid,
    p_reservation_id,
    trim(p_device_model),
    trim(p_imei),
    p_expected_value_cents,
    p_minimum_value_cents,
    p_maintenance_options,
    coalesce(p_liquid_exposure, false),
    p_photo_paths,
    'pending'
  );

  return p_offer_id;
end;
$$;

revoke all on function public.create_used_device_offer(
  uuid, uuid, text, text, integer, integer, text[], boolean, text[]
) from public, anon;
grant execute on function public.create_used_device_offer(
  uuid, uuid, text, text, integer, integer, text[], boolean, text[]
) to authenticated;

-- Storage: upload/read fotos do usado (bucket privado)
update storage.buckets
set
  file_size_limit = 6291456,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'used-device-photos';

drop policy if exists "used_device_photos_owner_insert" on storage.objects;
create policy "used_device_photos_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'used-device-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "used_device_photos_read" on storage.objects;
create policy "used_device_photos_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'used-device-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_user_role() in ('admin', 'staff')
    )
  );
