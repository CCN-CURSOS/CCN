-- CCN · Dos monedas (soles y dólares), PayPal y tope de descuento de las vendedoras
-- Pégalo UNA vez en Supabase > SQL Editor > Run. Se puede correr de nuevo sin problema.

-- 1) Precios en dólares por curso (vacío = ese curso aún no se vende en dólares)
alter table public.cursos add column if not exists precio_usd numeric check (precio_usd is null or precio_usd >= 0);
alter table public.cursos add column if not exists precio_antes_usd numeric check (precio_antes_usd is null or precio_antes_usd >= 0);

-- 2) Cada inscripción y cada pago queda en UNA sola moneda: PEN (soles) o USD (dólares)
alter table public.matriculas add column if not exists moneda text not null default 'PEN';
alter table public.pagos add column if not exists moneda text not null default 'PEN';
alter table public.interesados add column if not exists moneda text not null default 'PEN';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matriculas_moneda_chk') then
    alter table public.matriculas add constraint matriculas_moneda_chk check (moneda in ('PEN', 'USD'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pagos_moneda_chk') then
    alter table public.pagos add constraint pagos_moneda_chk check (moneda in ('PEN', 'USD'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'interesados_moneda_chk') then
    alter table public.interesados add constraint interesados_moneda_chk check (moneda in ('PEN', 'USD'));
  end if;
end $$;

-- 3) El historial del grupo ya no dice siempre "S/": usa la moneda de la inscripción
create or replace function public.log_matricula() returns trigger
  language plpgsql security definer set search_path = public as $$
declare nom text;
begin
  select nombres || ' ' || apellido_paterno into nom from public.alumnos where id = coalesce(new.alumno_id, old.alumno_id);
  if tg_op = 'INSERT' then
    perform public.anotar_historial(new.grupo_id, new.curso_id, new.alumno_id, 'inscripcion', 'Inscrito: ' || coalesce(nom, '—') || ' en ' || new.grupo_codigo || ' (' || case when new.moneda = 'USD' then 'US$ ' else 'S/ ' end || new.precio || ')');
  elsif tg_op = 'UPDATE' and old.estado <> new.estado then
    perform public.anotar_historial(new.grupo_id, new.curso_id, new.alumno_id, 'matricula', coalesce(nom, '—') || ': matrícula ' || new.estado || ' en ' || new.grupo_codigo);
  elsif tg_op = 'DELETE' then
    perform public.anotar_historial(old.grupo_id, old.curso_id, old.alumno_id, 'matricula', 'Matrícula borrada: ' || coalesce(nom, '—') || ' en ' || old.grupo_codigo);
  end if;
  return null;
end $$;

create or replace function public.log_pago() returns trigger
  language plpgsql security definer set search_path = public as $$
declare m record; nom text;
begin
  select * into m from public.matriculas where id = new.matricula_id;
  select nombres || ' ' || apellido_paterno into nom from public.alumnos where id = m.alumno_id;
  perform public.anotar_historial(m.grupo_id, m.curso_id, m.alumno_id, 'pago', 'Pago ' || new.numero || ': ' || coalesce(nom, '—') || ' ' || case when new.moneda = 'USD' then 'US$ ' else 'S/ ' end || round(new.monto, 2) || ' (' || new.metodo || ') en ' || m.grupo_codigo);
  return null;
end $$;

-- 4) El tope de descuento (en %) lo cambia gerencia en Web > Ajustes. Sin valor = no hay descuento libre.
--    (No se inserta nada aquí a propósito: el número lo defines tú.)

select 'cursos' as tabla, count(*) filter (where precio_usd is not null) as con_precio_usd from public.cursos
union all select 'matriculas en USD', count(*) from public.matriculas where moneda = 'USD';
