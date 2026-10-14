-- EVALUACIONES T1 Y T2 POR CURSO · cronograma, enlaces de entrega y revisión ----------------
-- Cada curso tiene T1 (primera mitad) y T2 (proyecto final). El Club Ofimática tiene T1 y T2 por programa (Word, Excel, PowerPoint).
-- Pégalo DESPUÉS de certificados.sql. Se puede pegar más de una vez. Los títulos sembrados son BORRADOR: se editan desde el panel.
create table if not exists public.entregables (
  id          uuid primary key default gen_random_uuid(),
  creado      timestamptz not null default now(),
  curso_id    text not null,
  orden       integer not null default 1,
  titulo      text not null check (char_length(titulo) between 3 and 200),
  detalle     text not null default '',
  programa    text not null default '',                  -- solo Club Ofimática: Word, Excel o PowerPoint
  obligatorio boolean not null default true,
  activo      boolean not null default true
);
alter table public.entregables add column if not exists etapa text not null default 'T2';   -- 'T1' (mitad) o 'T2' (final)
alter table public.entregables drop constraint if exists entregables_etapa_check;
alter table public.entregables add constraint entregables_etapa_check check (etapa in ('T1', 'T2'));
create index if not exists entregables_curso_idx on public.entregables (curso_id, orden);

create table if not exists public.entregas (
  id            uuid primary key default gen_random_uuid(),
  creado        timestamptz not null default now(),
  actualizado   timestamptz not null default now(),
  grupo_id      text not null,
  alumno_id     uuid not null references public.alumnos (id) on delete cascade,
  entregable_id uuid not null references public.entregables (id) on delete cascade,
  entregado     boolean not null default false,
  nota          text not null default '',
  registrado_por text default (auth.jwt() ->> 'email'),
  unique (grupo_id, alumno_id, entregable_id)
);
alter table public.entregas add column if not exists aprobado boolean not null default false;   -- el profesor lo revisó y está aprobado
alter table public.entregas add column if not exists repaso   boolean not null default false;   -- elegido para repasar en la última clase
create index if not exists entregas_grupo_idx on public.entregas (grupo_id);

-- Por grupo y por evaluación: enlace de entrega (carpeta de Drive o Google Forms, lo pega coordinación) y fecha límite si se quiere distinta a la calculada.
create table if not exists public.grupo_evaluaciones (
  id            uuid primary key default gen_random_uuid(),
  grupo_id      text not null,
  entregable_id uuid not null references public.entregables (id) on delete cascade,
  enlace        text not null default '',
  fecha_limite  date,
  actualizado   timestamptz not null default now(),
  unique (grupo_id, entregable_id)
);

alter table public.entregables enable row level security;
alter table public.entregas enable row level security;
alter table public.grupo_evaluaciones enable row level security;

-- Evaluaciones: las ve todo el equipo; las define gerencia y coordinación académica.
drop policy if exists "entregables_ver" on public.entregables;
create policy "entregables_ver" on public.entregables for select to authenticated using (public.es_equipo());
drop policy if exists "entregables_gerente" on public.entregables;
drop policy if exists "entregables_academico" on public.entregables;
create policy "entregables_academico" on public.entregables for all to authenticated
  using (public.es_academico()) with check (public.es_academico());

-- Entregas: las revisa el profesor del grupo (o gerencia). El asistente académico solo las ve.
drop policy if exists "entregas_ver" on public.entregas;
create policy "entregas_ver" on public.entregas for select to authenticated
  using (public.es_academico() or public.es_profesor_de(grupo_id));
drop policy if exists "entregas_crear" on public.entregas;
create policy "entregas_crear" on public.entregas for insert to authenticated
  with check (public.es_gerente() or public.es_profesor_de(grupo_id));
drop policy if exists "entregas_editar" on public.entregas;
create policy "entregas_editar" on public.entregas for update to authenticated
  using (public.es_gerente() or public.es_profesor_de(grupo_id))
  with check (public.es_gerente() or public.es_profesor_de(grupo_id));
drop policy if exists "entregas_borrar" on public.entregas;
create policy "entregas_borrar" on public.entregas for delete to authenticated using (public.es_gerente());

-- Enlaces y fechas por grupo: los pone coordinación; el profesor del grupo los ve.
drop policy if exists "grupo_eval_ver" on public.grupo_evaluaciones;
create policy "grupo_eval_ver" on public.grupo_evaluaciones for select to authenticated
  using (public.es_academico() or public.es_profesor_de(grupo_id));
drop policy if exists "grupo_eval_escribir" on public.grupo_evaluaciones;
create policy "grupo_eval_escribir" on public.grupo_evaluaciones for all to authenticated
  using (public.es_academico()) with check (public.es_academico());

-- El asistente académico también ve las clases y la asistencia de todos los grupos (para el cronograma y los certificados).
drop policy if exists "clases_ver" on public.clases;
create policy "clases_ver" on public.clases for select to authenticated
  using (public.es_academico() or public.es_profesor_de(grupo_id));
drop policy if exists "asistencias_ver" on public.asistencias;
create policy "asistencias_ver" on public.asistencias for select to authenticated
  using (public.es_academico() or public.es_profesor_de(grupo_id));

-- ASISTENTE ACADÉMICO: lo que necesita ver y hacer (sin pagos ni tarifas) -------------------------------------
-- Ver alumnos y matrículas de todos los grupos (para certificados). Las vendedoras siguen viendo solo lo suyo.
drop policy if exists "alumnos_ver_academico" on public.alumnos;
create policy "alumnos_ver_academico" on public.alumnos for select to authenticated using (public.es_academico());
drop policy if exists "matriculas_ver_academico" on public.matriculas;
create policy "matriculas_ver_academico" on public.matriculas for select to authenticated using (public.es_academico());
-- Crear y editar grupos (no borrarlos) y programar sus clases.
drop policy if exists "grupos_academico_crear" on public.grupos;
create policy "grupos_academico_crear" on public.grupos for insert to authenticated with check (public.es_academico());
drop policy if exists "grupos_academico_editar" on public.grupos;
create policy "grupos_academico_editar" on public.grupos for update to authenticated using (public.es_academico()) with check (public.es_academico());
drop policy if exists "clases_academico" on public.clases;
create policy "clases_academico" on public.clases for all to authenticated using (public.es_academico()) with check (public.es_academico());
-- Registrar el grupo de WhatsApp de cada grupo también lo puede hacer el asistente.
drop policy if exists "gwa_crear_academico" on public.grupos_whatsapp;
create policy "gwa_crear_academico" on public.grupos_whatsapp for insert to authenticated with check (public.es_academico());
drop policy if exists "gwa_editar_academico" on public.grupos_whatsapp;
create policy "gwa_editar_academico" on public.grupos_whatsapp for update to authenticated using (public.es_academico()) with check (public.es_academico());
-- Lista de alumnos del grupo (nombre, código y correo) también para el asistente.
create or replace function public.alumnos_del_grupo(p_grupo text)
  returns table (alumno_id uuid, matricula_id uuid, codigo text, nombres text, apellido_paterno text, apellido_materno text, email text)
  language sql stable security definer set search_path = public as $$
  select a.id, m.id, a.codigo, a.nombres, a.apellido_paterno, a.apellido_materno, a.email
  from public.matriculas m
  join public.alumnos a on a.id = m.alumno_id
  where m.grupo_id = p_grupo and m.estado = 'activa'
    and (public.es_ventas() or public.es_academico() or public.es_profesor_de(p_grupo))
  order by a.apellido_paterno, a.apellido_materno, a.nombres
$$;

-- Accesos de cada grupo: Zoom y clases grabadas (las carpetas de T1 y T2 están en grupo_evaluaciones).
create table if not exists public.grupo_accesos (
  grupo_id    text primary key,
  zoom        text not null default '',
  grabaciones text not null default '',
  actualizado timestamptz not null default now()
);
alter table public.grupo_accesos enable row level security;
drop policy if exists "grupo_accesos_ver" on public.grupo_accesos;
create policy "grupo_accesos_ver" on public.grupo_accesos for select to authenticated
  using (public.es_academico() or public.es_profesor_de(grupo_id));
drop policy if exists "grupo_accesos_escribir" on public.grupo_accesos;
create policy "grupo_accesos_escribir" on public.grupo_accesos for all to authenticated
  using (public.es_academico()) with check (public.es_academico());

-- ASIGNAR PROFESOR sin ver pagos: el asistente solo elige a quién; la tarifa y las horas se copian solas desde la ficha
-- del profesor y del curso, y gerencia las revisa. Si el profesor ya dictó horas, solo gerencia lo cambia.
drop function if exists public.instructores_disponibles();
create or replace function public.instructores_disponibles()
  returns table (id uuid, nombre text, email text, acceso boolean)
  language sql stable security definer set search_path = public as $$
  select t.id, t.nombre, t.email,
         exists (select 1 from public.admins a where a.rol = 'profesor' and lower(a.email) = lower(t.email)) as acceso
  from public.trabajadores t
  where t.activo and t.puesto = 'instructor' and public.es_academico() order by t.nombre
$$;
create or replace function public.asignar_instructor(p_grupo text, p_trabajador uuid) returns void
  language plpgsql security definer set search_path = public as $$
declare t record; g record; h numeric; a record;
begin
  if not public.es_academico() then raise exception 'No tienes permiso para asignar profesores.'; end if;
  select * into t from public.trabajadores where id = p_trabajador and activo and puesto = 'instructor';
  if not found then raise exception 'Ese profesor no existe o no está marcado como instructor.'; end if;
  select * into g from public.grupos where id::text = p_grupo;
  if not found then raise exception 'El grupo no existe.'; end if;
  select * into a from public.asignaciones where grupo_id = p_grupo;
  if found and a.trabajador_id = p_trabajador then return; end if;
  if found and a.horas_dictadas > 0 and not public.es_gerente() then
    raise exception 'Este grupo ya tiene horas dictadas por otro profesor: el cambio lo hace gerencia.';
  end if;
  select coalesce(c.horas, 0) into h from public.cursos c where c.id = g.curso_id;
  insert into public.asignaciones (grupo_id, trabajador_id, horas, horas_dictadas, tarifa_hora, nota)
  values (p_grupo, p_trabajador, h, 0, t.tarifa_hora, 'Asignado por el asistente académico: gerencia revisa la tarifa y las horas')
  on conflict (grupo_id) do update
    set trabajador_id = excluded.trabajador_id, horas = excluded.horas, tarifa_hora = excluded.tarifa_hora, nota = excluded.nota;
end $$;
create or replace function public.quitar_instructor(p_grupo text) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not public.es_academico() then raise exception 'No tienes permiso.'; end if;
  if exists (select 1 from public.asignaciones where grupo_id = p_grupo and horas_dictadas > 0) and not public.es_gerente() then
    raise exception 'Ya tiene horas dictadas: el cambio lo hace gerencia.';
  end if;
  delete from public.asignaciones where grupo_id = p_grupo;
end $$;
revoke all on function public.instructores_disponibles() from public, anon;
revoke all on function public.asignar_instructor(text, uuid) from public, anon;
revoke all on function public.quitar_instructor(text) from public, anon;
grant execute on function public.instructores_disponibles() to authenticated;
grant execute on function public.asignar_instructor(text, uuid) to authenticated;
grant execute on function public.quitar_instructor(text) to authenticated;

-- REAPERTURA TEMPORAL DE LA ASISTENCIA ----------------------------------------------------------------------
-- Si el profesor olvidó tomar la asistencia, el asistente académico (o gerencia) puede reabrir esa clase por unas horas (máx. 48)
-- escribiendo el motivo. El profesor la registra él mismo; queda anotado quién autorizó y por qué, y se cierra sola al vencer.
alter table public.clases add column if not exists reabierta_hasta  timestamptz;
alter table public.clases add column if not exists reabierta_por    text not null default '';
alter table public.clases add column if not exists reabierta_motivo text not null default '';

create or replace function public.reabrir_asistencia(p_clase uuid, p_horas integer, p_motivo text) returns void
  language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if not public.es_academico() then raise exception 'No tienes permiso para reabrir la asistencia.'; end if;
  if p_horas is null or p_horas < 1 or p_horas > 48 then raise exception 'La reapertura puede durar de 1 a 48 horas.'; end if;
  if length(trim(coalesce(p_motivo, ''))) < 10 then raise exception 'Escribe el motivo de la reapertura (mínimo 10 letras).'; end if;
  select * into c from public.clases where id = p_clase;
  if not found then raise exception 'La clase no existe.'; end if;
  if clock_timestamp() <= c.fin then raise exception 'Esa clase todavía no terminó: la asistencia sigue abierta.'; end if;
  update public.clases
     set reabierta_hasta = clock_timestamp() + make_interval(hours => p_horas),
         reabierta_por = lower(coalesce(auth.jwt() ->> 'email', '')),
         reabierta_motivo = trim(p_motivo)
   where id = p_clase;
end $$;
create or replace function public.cerrar_reapertura(p_clase uuid) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not public.es_academico() then raise exception 'No tienes permiso.'; end if;
  update public.clases set reabierta_hasta = clock_timestamp() where id = p_clase and reabierta_hasta is not null;
end $$;
revoke all on function public.reabrir_asistencia(uuid, integer, text) from public, anon;
revoke all on function public.cerrar_reapertura(uuid) from public, anon;
grant execute on function public.reabrir_asistencia(uuid, integer, text) to authenticated;
grant execute on function public.cerrar_reapertura(uuid) to authenticated;

-- Misma protección de siempre, pero respetando la reapertura (el profesor puede registrar mientras dure).
create or replace function public.proteger_asistencia() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  c record;
  ahora timestamptz := clock_timestamp();
  mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
  reab boolean;
  fuera boolean;
begin
  select * into c from public.clases where id = new.clase_id;
  if not found then raise exception 'La clase no existe.'; end if;
  new.grupo_id := c.grupo_id;
  if tg_op = 'UPDATE' and (new.clase_id is distinct from old.clase_id or new.alumno_id is distinct from old.alumno_id) then
    raise exception 'No se puede cambiar la clase ni el alumno.';
  end if;
  if not exists (select 1 from public.matriculas m where m.alumno_id = new.alumno_id and m.grupo_id = c.grupo_id and m.estado = 'activa') then
    raise exception 'Ese alumno no está inscrito en este grupo.';
  end if;
  reab := ahora > c.fin and c.reabierta_hasta is not null and ahora <= c.reabierta_hasta;
  fuera := (ahora > c.fin and not reab) or ahora < c.inicio - interval '10 minutes';

  if public.es_gerente() then
    if fuera and (length(trim(coalesce(new.motivo, ''))) < 10 or (tg_op = 'UPDATE' and new.motivo is not distinct from old.motivo)) then
      raise exception 'La clase está cerrada. Para cambiar la asistencia escribe el sustento (el correo del alumno).';
    end if;
    new.editado_por := mail; new.editado_en := now();
  elsif public.es_profesor_de(c.grupo_id) then
    if ahora < c.inicio - interval '10 minutes' then
      raise exception 'Esta clase aún no empieza: podrás tomar la asistencia desde 10 minutos antes.';
    elsif fuera then
      raise exception 'La clase terminó: la asistencia está cerrada. Pide al asistente académico que la reabra.';
    end if;
    if reab then
      new.motivo := 'Reapertura autorizada por ' || split_part(c.reabierta_por, '@', 1) || ': ' || c.reabierta_motivo;
      new.editado_por := mail; new.editado_en := now();
    else
      new.motivo := case when tg_op = 'UPDATE' then old.motivo else '' end;
      new.editado_por := case when tg_op = 'UPDATE' then mail else '' end;
      new.editado_en := case when tg_op = 'UPDATE' then now() else null end;
    end if;
  else
    raise exception 'No tienes permiso para registrar esta asistencia.';
  end if;
  new.registrado_por := case when tg_op = 'UPDATE' then old.registrado_por else mail end;
  return new;
end $$;

-- REPARACIÓN: filas viejas quedaron todas como T2 (por el valor por defecto). Si un curso/programa no tiene T1, la primera pasa a T1.
with r as (
  select id, row_number() over (partition by curso_id, programa order by orden, creado) n
    from public.entregables where activo
)
update public.entregables e set etapa = case when r.n = 1 then 'T1' else 'T2' end
  from r
 where e.id = r.id
   and not exists (select 1 from public.entregables x where x.curso_id = e.curso_id and x.programa = e.programa and x.etapa = 'T1' and x.activo);

-- SEMILLA (borrador): solo para los cursos que todavía no tienen evaluaciones.
do $$
declare
  r record; cid uuid;
begin
  for r in
    select * from (values
      ('Word',          1, 'T1', 'Documento con formato profesional, imagen y tabla', ''),
      ('Word',          2, 'T2', 'Documento largo con estilos, tabla de contenido y plantilla propia', ''),
      ('Excel',         1, 'T1', 'Hoja con fórmulas y funciones de uso diario', ''),
      ('Excel',         2, 'T2', 'Control de ventas o gastos con tabla, gráfico y tabla dinámica', ''),
      ('PowerPoint',    1, 'T1', 'Presentación corta con diseño y patrón propio', ''),
      ('PowerPoint',    2, 'T2', 'Presentación completa expuesta con modo presentador', ''),
      ('Club%',         1, 'T1', 'Word · Documento con formato profesional, imagen y tabla', 'Word'),
      ('Club%',         2, 'T2', 'Word · Documento largo con estilos, tabla de contenido y plantilla propia', 'Word'),
      ('Club%',         3, 'T1', 'Excel · Hoja con fórmulas y funciones de uso diario', 'Excel'),
      ('Club%',         4, 'T2', 'Excel · Control de ventas o gastos con tabla, gráfico y tabla dinámica', 'Excel'),
      ('Club%',         5, 'T1', 'PowerPoint · Presentación corta con diseño y patrón propio', 'PowerPoint'),
      ('Club%',         6, 'T2', 'PowerPoint · Presentación completa expuesta con modo presentador', 'PowerPoint'),
      ('Notion%',       1, 'T1', 'Base de datos con vistas y filtros', ''),
      ('Notion%',       2, 'T2', 'Sistema Notion para tu negocio o estudios, con presentación', ''),
      ('Illustrator%',  1, 'T1', 'Ilustración con Pluma y formas', ''),
      ('Illustrator%',  2, 'T2', 'Logotipo o pieza final exportada en PNG, SVG y PDF, con presentación', ''),
      ('Photoshop%',    1, 'T1', 'Retoque o fotomontaje simple', ''),
      ('Photoshop%',    2, 'T2', 'Pieza final para redes o fotomontaje, con presentación', ''),
      ('Claude%',       1, 'T1', 'Mis 5 mejores instrucciones', ''),
      ('Claude%',       2, 'T2', 'Proyecto aplicado a tu negocio o estudios, con presentación', ''),
      ('Canva%',        1, 'T1', 'Publicación o historia para redes', ''),
      ('Canva%',        2, 'T2', 'Pack de marca con kit de marca y piezas, con presentación', ''),
      ('IA aplicada%',  1, 'T1', 'Flujo de IA para un proceso del negocio', ''),
      ('IA aplicada%',  2, 'T2', 'Proyecto final: plan de IA del negocio, con presentación', ''),
      ('Crea y publica%', 1, 'T1', 'Página HTML y CSS responsive', ''),
      ('Crea y publica%', 2, 'T2', 'Página publicada con enlace propio, con presentación', '')
    ) as t(curso, orden, etapa, titulo, programa)
  loop
    select id into cid from public.cursos where titulo ilike r.curso order by orden limit 1;
    if cid is not null and not exists (select 1 from public.entregables e where e.curso_id = cid::text and e.programa = r.programa and e.etapa = r.etapa and e.activo) then
      insert into public.entregables (curso_id, orden, etapa, titulo, programa) values (cid::text, r.orden, r.etapa, r.titulo, r.programa);
    end if;
  end loop;
end $$;

-- MATERIAL DEL CURSO y NOTAS POR ALUMNO ---------------------------------------------------------------------
-- Material: enlaces que el profesor deja para su grupo (presentaciones, plantillas, carpetas).
create table if not exists public.grupo_material (
  id        uuid primary key default gen_random_uuid(),
  grupo_id  text not null,
  titulo    text not null,
  enlace    text not null,
  creado    timestamptz not null default now(),
  creado_por text not null default ''
);
create index if not exists grupo_material_grupo on public.grupo_material (grupo_id);
alter table public.grupo_material enable row level security;
drop policy if exists "grupo_material_ver" on public.grupo_material;
create policy "grupo_material_ver" on public.grupo_material for select to authenticated
  using (public.es_academico() or public.es_profesor_de(grupo_id));
drop policy if exists "grupo_material_escribir" on public.grupo_material;
create policy "grupo_material_escribir" on public.grupo_material for all to authenticated
  using (public.es_academico() or public.es_profesor_de(grupo_id))
  with check (public.es_academico() or public.es_profesor_de(grupo_id));

-- Notas: observaciones del profesor sobre cada alumno (las ve el profesor del grupo y la coordinación académica).
create table if not exists public.alumno_notas (
  grupo_id    text not null,
  alumno_id   uuid not null,
  nota        text not null default '',
  autor       text not null default '',
  actualizado timestamptz not null default now(),
  primary key (grupo_id, alumno_id)
);
alter table public.alumno_notas enable row level security;
drop policy if exists "alumno_notas_ver" on public.alumno_notas;
create policy "alumno_notas_ver" on public.alumno_notas for select to authenticated
  using (public.es_academico() or public.es_profesor_de(grupo_id));
drop policy if exists "alumno_notas_escribir" on public.alumno_notas;
create policy "alumno_notas_escribir" on public.alumno_notas for all to authenticated
  using (public.es_gerente() or public.es_profesor_de(grupo_id))
  with check (public.es_gerente() or public.es_profesor_de(grupo_id));

select c.titulo, count(e.id) as evaluaciones, string_agg(distinct e.etapa, '+' order by e.etapa) as etapas
  from public.cursos c left join public.entregables e on e.curso_id = c.id::text
 group by c.titulo, c.orden order by c.orden;
