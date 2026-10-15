-- CCN · Correo de bienvenida: guarda cuándo se envió a cada inscripción ---------------------------
-- Pégalo completo en Supabase → SQL Editor → Run. Se puede pegar más de una vez sin problema.
alter table public.matriculas add column if not exists bienvenida_en timestamptz;
select count(*) as matriculas, count(bienvenida_en) as con_bienvenida from public.matriculas;
