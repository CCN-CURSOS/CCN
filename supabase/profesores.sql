-- CCN · Profesores (Etapa 2): rol profesor, clases, asistencia que se cierra sola, y seguridad
-- Pégalo UNA vez en Supabase > SQL Editor > Run (después de crm.sql). Se puede repetir sin problema.
-- No borra nada de lo que ya tienes.

-- 1) ROL PROFESOR --------------------------------------------------------------------
alter table public.admins drop constraint if exists admins_rol_check;
alter table public.admins add constraint admins_rol_check check (rol in ('gerente', 'vendedora', 'profesor'));

create or replace function public.es_profesor() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() = 'profesor', false)
$$;

-- ¿El que entra dicta este grupo? (su correo debe estar en Trabajadores y el grupo asignado a él)
create or replace function public.es_profesor_de(p_grupo text) returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() = 'profesor', false) and exists (
    select 1 from public.asignaciones a
    join public.trabajadores t on t.id = a.trabajador_id
    where a.grupo_id = p_grupo and t.activo and lower(t.email) = lower(auth.jwt() ->> 'email')
  )
$$;

-- 2) QUE EL PROFESOR NO VEA LO QUE NO LE TOCA ------------------------------------------
-- Antes cualquiera del equipo podía ver los enlaces de WhatsApp, las consultas y los interesados.
-- Ahora solo ventas (gerente y vendedoras).
drop policy if exists "gwa_ver" on public.grupos_whatsapp;
create policy "gwa_ver" on public.grupos_whatsapp for select to authenticated using (public.es_ventas());

drop policy if exists "interesados_admin_ver" on public.interesados;
create policy "interesados_admin_ver" on public.interesados for select to authenticated using (public.es_ventas());
drop policy if exists "interesados_admin_editar" on public.interesados;
create policy "interesados_admin_editar" on public.interesados for update to authenticated
  using (public.es_ventas()) with check (public.es_ventas());
drop policy if exists "interesados_admin_borrar" on public.interesados;
create policy "interesados_admin_borrar" on public.interesados for delete to authenticated using (public.es_ventas());

drop policy if exists "consultas_admin_ver" on public.consultas;
create policy "consultas_admin_ver" on public.consultas for select to authenticated using (public.es_ventas());
drop policy if exists "consultas_admin_editar" on public.consultas;
create policy "consultas_admin_editar" on public.consultas for update to authenticated
  using (public.es_ventas()) with check (public.es_ventas());
drop policy if exists "consultas_admin_borrar" on public.consultas;
create policy "consultas_admin_borrar" on public.consultas for delete to authenticated using (public.es_ventas());

-- 3) CLASES (cada sesión de un grupo con su día y hora) -----------------------------------
-- Las genera gerencia desde Horarios > "Generar clases". La asistencia solo se puede tomar
-- dentro del horario de la clase (desde 10 minutos antes hasta la hora de fin).
create table if not exists public.clases (
  id          uuid primary key default gen_random_uuid(),
  creado      timestamptz not null default now(),
  creado_por  text default (auth.jwt() ->> 'email'),
  grupo_id    text not null,
  numero      integer not null check (numero > 0),
  inicio      timestamptz not null,
  fin         timestamptz not null,
  check (fin > inicio),
  unique (grupo_id, numero)
);
create index if not exists clases_grupo_idx on public.clases (grupo_id);
alter table public.clases enable row level security;
drop policy if exists "clases_ver" on public.clases;
create policy "clases_ver" on public.clases for select to authenticated
  using (public.es_gerente() or public.es_profesor_de(grupo_id));
drop policy if exists "clases_gerente" on public.clases;
create policy "clases_gerente" on public.clases for all to authenticated
  using (public.es_gerente()) with check (public.es_gerente());

-- 4) ASISTENCIA Y PARTICIPACIÓN (una fila por alumno y clase) ------------------------------
create table if not exists public.asistencias (
  id             uuid primary key default gen_random_uuid(),
  creado         timestamptz not null default now(),
  clase_id       uuid not null references public.clases (id) on delete cascade,
  grupo_id       text not null default '',
  alumno_id      uuid not null references public.alumnos (id) on delete cascade,
  estado         text not null check (estado in ('presente', 'tarde', 'falta', 'justificada')),
  participo      boolean not null default false,
  registrado_por text not null default '',
  editado_por    text not null default '',
  editado_en     timestamptz,
  motivo         text not null default '',           -- sustento (solo cuando gerencia corrige una clase cerrada)
  unique (clase_id, alumno_id)
);
create index if not exists asistencias_grupo_idx on public.asistencias (grupo_id);
create index if not exists asistencias_alumno_idx on public.asistencias (alumno_id);

create table if not exists public.asistencia_historial (
  id              uuid primary key default gen_random_uuid(),
  creado          timestamptz not null default now(),
  clase_id        uuid not null,
  grupo_id        text not null default '',
  alumno_id       uuid not null,
  estado_antes    text,
  estado_nuevo    text,
  participo_antes boolean,
  participo_nuevo boolean,
  motivo          text not null default '',
  por             text not null default ''
);
create index if not exists asistencia_hist_idx on public.asistencia_historial (clase_id, alumno_id);

alter table public.asistencias enable row level security;
alter table public.asistencia_historial enable row level security;

drop policy if exists "asistencias_ver" on public.asistencias;
create policy "asistencias_ver" on public.asistencias for select to authenticated
  using (public.es_gerente() or public.es_profesor_de(grupo_id));
drop policy if exists "asistencias_crear" on public.asistencias;
create policy "asistencias_crear" on public.asistencias for insert to authenticated
  with check (public.es_gerente() or public.es_profesor_de(grupo_id));
drop policy if exists "asistencias_editar" on public.asistencias;
create policy "asistencias_editar" on public.asistencias for update to authenticated
  using (public.es_gerente() or public.es_profesor_de(grupo_id))
  with check (public.es_gerente() or public.es_profesor_de(grupo_id));
-- Nadie borra asistencias (no hay política de borrado).
drop policy if exists "asistencia_hist_ver" on public.asistencia_historial;
create policy "asistencia_hist_ver" on public.asistencia_historial for select to authenticated using (public.es_gerente());

-- Reglas que decide el servidor (no se pueden saltar desde el navegador):
--   · El profesor solo registra dentro del horario de SU clase; al terminar, queda cerrada.
--   · Después del cierre, solo gerencia puede cambiarla y debe escribir el sustento (el correo del alumno).
--   · El alumno debe estar inscrito (activo) en ese grupo.
create or replace function public.proteger_asistencia() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  c record;
  ahora timestamptz := clock_timestamp();
  mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
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
  fuera := ahora > c.fin or ahora < c.inicio - interval '10 minutes';

  if public.es_gerente() then
    if fuera and (length(trim(coalesce(new.motivo, ''))) < 10 or (tg_op = 'UPDATE' and new.motivo is not distinct from old.motivo)) then
      raise exception 'La clase está cerrada. Para cambiar la asistencia escribe el sustento (el correo del alumno).';
    end if;
    new.editado_por := mail; new.editado_en := now();
  elsif public.es_profesor_de(c.grupo_id) then
    if ahora < c.inicio - interval '10 minutes' then
      raise exception 'Esta clase aún no empieza: podrás tomar la asistencia desde 10 minutos antes.';
    elsif fuera then
      raise exception 'La clase terminó: la asistencia está cerrada. Solo gerencia puede corregirla.';
    end if;
    new.motivo := case when tg_op = 'UPDATE' then old.motivo else '' end;
    new.editado_por := case when tg_op = 'UPDATE' then mail else '' end;
    new.editado_en := case when tg_op = 'UPDATE' then now() else null end;
  else
    raise exception 'No tienes permiso para registrar esta asistencia.';
  end if;
  new.registrado_por := case when tg_op = 'UPDATE' then old.registrado_por else mail end;
  return new;
end $$;
drop trigger if exists trg_proteger_asistencia on public.asistencias;
create trigger trg_proteger_asistencia before insert or update on public.asistencias
  for each row execute function public.proteger_asistencia();

create or replace function public.log_asistencia() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.estado = old.estado and new.participo = old.participo and new.motivo = old.motivo then
    return new;
  end if;
  insert into public.asistencia_historial (clase_id, grupo_id, alumno_id, estado_antes, estado_nuevo, participo_antes, participo_nuevo, motivo, por)
  values (new.clase_id, new.grupo_id, new.alumno_id,
          case when tg_op = 'UPDATE' then old.estado end, new.estado,
          case when tg_op = 'UPDATE' then old.participo end, new.participo,
          new.motivo, lower(coalesce(auth.jwt() ->> 'email', '')));
  return new;
end $$;
drop trigger if exists trg_log_asistencia on public.asistencias;
create trigger trg_log_asistencia after insert or update on public.asistencias
  for each row execute function public.log_asistencia();

-- 5) LO QUE VE EL PROFESOR (sin tarifas ni pagos) ---------------------------------------
-- Sus grupos asignados y las horas.
create or replace function public.profesor_mis_grupos()
  returns table (grupo_id text, horas numeric, horas_dictadas numeric)
  language sql stable security definer set search_path = public as $$
  select a.grupo_id, a.horas, a.horas_dictadas
  from public.asignaciones a
  join public.trabajadores t on t.id = a.trabajador_id
  where t.activo and lower(t.email) = lower(auth.jwt() ->> 'email') and public.mi_rol() = 'profesor'
$$;

-- Los alumnos de un grupo: solo nombre, código y correo (NO el DNI/CE ni el celular).
create or replace function public.alumnos_del_grupo(p_grupo text)
  returns table (alumno_id uuid, matricula_id uuid, codigo text, nombres text, apellido_paterno text, apellido_materno text, email text)
  language sql stable security definer set search_path = public as $$
  select a.id, m.id, a.codigo, a.nombres, a.apellido_paterno, a.apellido_materno, a.email
  from public.matriculas m
  join public.alumnos a on a.id = m.alumno_id
  where m.grupo_id = p_grupo and m.estado = 'activa'
    and (public.es_ventas() or public.es_profesor_de(p_grupo))
  order by a.apellido_paterno, a.apellido_materno, a.nombres
$$;

revoke all on function public.profesor_mis_grupos() from public, anon;
revoke all on function public.alumnos_del_grupo(text) from public, anon;
grant execute on function public.profesor_mis_grupos() to authenticated;
grant execute on function public.alumnos_del_grupo(text) to authenticated;
