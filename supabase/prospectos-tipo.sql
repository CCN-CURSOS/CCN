-- CCN · Tipo de prospecto (Alto / Medio / Bajo)
-- Pégalo UNA vez en Supabase > SQL Editor > Run. No borra nada. Hazlo ANTES del git push.
alter table public.prospectos add column if not exists tipo text not null default 'medio';
alter table public.prospectos drop constraint if exists prospectos_tipo_check;
alter table public.prospectos add constraint prospectos_tipo_check check (tipo in ('alto', 'medio', 'bajo'));
select tipo, count(*) from public.prospectos group by tipo;
