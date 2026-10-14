-- CCN · Carrito: los cursos de un mismo carrito van a la MISMA vendedora.
-- Regla vigente: todo interesado de la web se reparte entre las vendedoras que "reciben interesados" (hoy solo Carla, así que todo le llega a ella).
-- Cuando haya más vendedoras, el reparto es por turnos, pero los cursos de una misma persona (mismo correo, 30 min) no se separan.
-- Pega este archivo completo en Supabase → SQL Editor. Es seguro repetirlo.

create or replace function public.derivar_interesado() returns trigger
  language plpgsql security definer set search_path = public as $$
declare prev text;
begin
  if tg_op = 'INSERT' then
    -- Un mismo carrito crea un interesado por curso: si la misma persona (mismo correo) ya entró en los últimos 30 minutos,
    -- va a la MISMA vendedora (siempre que ella siga recibiendo interesados). Si no, rota como siempre.
    select i.asignado_a into prev from public.interesados i
     where lower(i.email) = lower(new.email) and i.creado > now() - interval '30 minutes' and i.asignado_a is not null
     order by i.creado desc limit 1;
    if prev is not null and exists (select 1 from public.admins a where a.email = prev and a.rol = 'vendedora' and a.recibe_interesados) then
      new.asignado_a := prev;
    else
      new.asignado_a := public.elegir_vendedora();       -- nadie puede elegir a quién le toca desde la web
    end if;
    new.asignado_en := case when new.asignado_a is null then null else now() end;
  elsif new.asignado_a is distinct from old.asignado_a then
    if public.es_gerente() then new.asignado_en := now();   -- solo el gerente reasigna
    else new.asignado_a := old.asignado_a; new.asignado_en := old.asignado_en; end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_interesados_derivar on public.interesados;
create trigger trg_interesados_derivar before insert or update on public.interesados
  for each row execute function public.derivar_interesado();

select email, rol, recibe_interesados from public.admins where rol = 'vendedora' order by email;
