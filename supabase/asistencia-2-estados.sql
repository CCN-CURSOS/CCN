-- ASISTENCIA CON SOLO 2 ESTADOS: presente (Asistió) y falta (Faltó) -------------------------
-- Se puede pegar más de una vez sin problema.
update public.asistencias set estado = 'presente' where estado in ('tarde', 'justificada');
alter table public.asistencias drop constraint if exists asistencias_estado_check;
alter table public.asistencias add constraint asistencias_estado_check check (estado in ('presente', 'falta'));
