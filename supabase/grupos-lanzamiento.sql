-- ===================================================================================
-- GRUPOS DEL LANZAMIENTO (calendario del 12 oct 2026) + LIMPIEZA DE LO DESCARTADO
--   1) Borra los grupos que NO tienen inscritos (pruebas o descartados) y sus clases.
--      Los grupos con inscritos NUNCA se borran.
--   2) Borra los cursos descartados (Meta Ads y Tienda online) si no tienen inscritos.
--   3) Crea G01 a G08 con su fecha, días y horario, abiertos y con mínimo 5 / máximo 20.
--   4) Genera las clases de cada grupo (saltando feriados) para la asistencia.
-- Se puede pegar una sola vez; si lo repites, vuelve a dejarlo igual.
-- ===================================================================================

-- 1) Limpieza de grupos sin inscritos -----------------------------------------------
delete from public.clases where grupo_id in (select g.id::text from public.grupos g where not exists (select 1 from public.matriculas m where m.grupo_id = g.id::text));
delete from public.asignaciones where grupo_id in (select g.id::text from public.grupos g where not exists (select 1 from public.matriculas m where m.grupo_id = g.id::text));
delete from public.grupos_whatsapp where grupo_id in (select g.id::text from public.grupos g where not exists (select 1 from public.matriculas m where m.grupo_id = g.id::text));
delete from public.grupos g where not exists (select 1 from public.matriculas m where m.grupo_id = g.id::text);

-- 2) Cursos descartados (solo si no tienen inscritos) ---------------------------------
delete from public.cursos c
 where (c.titulo ilike 'Meta Ads%' or c.titulo ilike 'Tienda online%')
   and not exists (select 1 from public.matriculas m where m.curso_id = c.id::text);

-- 3) y 4) Grupos y clases ---------------------------------------------------------------
-- codigo, curso, días (texto de la web), horario, inicio, nº de clases, hora de inicio, minutos por clase,
-- minutos de la última clase de cada módulo (1,5 h en los cursos de ofimática), cada cuántas clases termina un módulo
do $$
declare
  r record;
  gid uuid;
  cid uuid;
  d date;
  n int;
  dur int;
  dows int[];
  cod text;
begin
  for r in
    select * from (values
      ('G01', 'Club Ofimática',        'Lunes y miércoles', '19:00 - 21:30', date '2026-11-23', 18, time '19:00', 150, 90, 6, array[1,3]),
      ('G02', 'Word',                  'Lunes y miércoles', '19:00 - 21:30', date '2026-11-23',  6, time '19:00', 150, 90, 6, array[1,3]),
      ('G03', 'Excel',                 'Lunes y miércoles', '19:00 - 21:30', date '2026-12-14',  6, time '19:00', 150, 90, 6, array[1,3]),
      ('G04', 'PowerPoint',            'Lunes y miércoles', '19:00 - 21:30', date '2027-01-04',  6, time '19:00', 150, 90, 6, array[1,3]),
      ('G05', 'Notion desde 0',        'Martes y jueves',   '19:00 - 21:00', date '2026-11-24',  8, time '19:00', 120, 120, 8, array[2,4]),
      ('G06', 'Photoshop desde 0',     'Lunes y miércoles', '19:00 - 21:00', date '2026-11-23',  8, time '19:00', 120, 120, 8, array[1,3]),
      ('G07', 'Illustrator desde 0',   'Martes y jueves',   '19:00 - 21:00', date '2026-11-24',  8, time '19:00', 120, 120, 8, array[2,4]),
      ('G08', 'Crea y publica%',       'Domingos',          '10:00 - 13:00', date '2026-11-22',  8, time '10:00', 180, 180, 8, array[0])
    ) as t(codigo, curso, dias, horario, inicio, nclases, hora, dur_min, dur_ult, modulo, dow)
  loop
    select id into cid from public.cursos where titulo ilike r.curso order by orden limit 1;
    if cid is null then raise exception 'No encuentro el curso "%". Revisa Web > Cursos.', r.curso; end if;
    if exists (select 1 from public.grupos where codigo = r.codigo) then continue; end if;

    insert into public.grupos (curso_id, inicio, dias, horario, estado, inscritos, minimo, maximo, mostrar_inscritos, activo, codigo)
    values (cid, r.inicio, r.dias, r.horario, 'abierto', 0, 5, 20, false, true, r.codigo)
    returning id into gid;

    dows := r.dow;
    n := 0;
    d := r.inicio;
    while n < r.nclases loop
      if extract(dow from d)::int = any (dows)
         and to_char(d, 'MM-DD') not in ('01-01','05-01','06-29','07-28','07-29','08-30','10-08','11-01','12-08','12-25') then
        n := n + 1;
        dur := case when n % r.modulo = 0 then r.dur_ult else r.dur_min end;
        insert into public.clases (grupo_id, numero, inicio, fin)
        values (gid::text, n,
                (d + r.hora) at time zone 'America/Lima',
                (d + r.hora) at time zone 'America/Lima' + make_interval(mins => dur));
      end if;
      d := d + 1;
    end loop;
  end loop;
end $$;

-- El próximo grupo que crees será G09
select setval('public.grupo_codigo_seq', greatest(8, (select coalesce(max(substring(codigo from 2)::int), 0) from public.grupos where codigo ~ '^G[0-9]+$')));

-- Resultado: debe mostrar G01 a G08 con sus fechas y clases
select g.codigo, c.titulo, g.inicio, g.dias, g.horario, g.minimo, g.maximo,
       (select count(*) from public.clases k where k.grupo_id = g.id::text) as clases,
       (select min(k.inicio at time zone 'America/Lima')::date from public.clases k where k.grupo_id = g.id::text) as primera,
       (select max(k.inicio at time zone 'America/Lima')::date from public.clases k where k.grupo_id = g.id::text) as ultima
  from public.grupos g join public.cursos c on c.id = g.curso_id
 order by g.codigo;
