-- CERTIFICADOS Y CONSTANCIAS · registro (gerencia y coordinación académica) + verificación pública ----------------
-- Se puede pegar más de una vez.

-- ASISTENTE ACADÉMICO: puesto propio (rol 'asistente') que vela por lo que pasa dentro de cada curso:
-- crea grupos y clases, asigna profesor, pone los accesos (Zoom, carpetas, grabaciones), vigila T1/T2 y emite certificados.
-- Mientras no exista ese puesto, Carla (vendedora) lo hace con el permiso extra «Asistente académico» que gerencia activa en Equipo.
-- NO ve pagos, precios, tarifas, contratos, horas ni la web pública.
alter table public.admins add column if not exists coordina boolean not null default false;     -- permiso extra para una vendedora
alter table public.admins drop constraint if exists admins_rol_check;
alter table public.admins add constraint admins_rol_check check (rol in ('gerente', 'vendedora', 'profesor', 'asistente'));
create or replace function public.es_academico() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() in ('gerente', 'asistente'), false)
      or coalesce((select a.coordina from public.admins a where a.email = (auth.jwt() ->> 'email') limit 1), false)
$$;

create table if not exists public.certificados (
  id             uuid primary key default gen_random_uuid(),
  creado         timestamptz not null default now(),
  codigo         text not null unique,                       -- número del documento, ej. CER-26-K7M2QX (va en el QR)
  tipo           text not null check (tipo in ('certificado', 'constancia', 'certificado_club', 'constancia_club')),
  matricula_id   uuid,
  alumno_id      uuid references public.alumnos (id) on delete set null,
  alumno_nombre  text not null,
  alumno_doc     text not null default '',                   -- DNI / CE del alumno
  alumno_codigo  text not null default '',                   -- código de alumno (AAAA-NNN-MM)
  curso_titulo   text not null,
  horas          numeric,
  grupo_codigo   text not null default '',
  fecha_inicio   date,
  fecha_fin      date,
  fecha_emision  date not null default ((now() at time zone 'America/Lima')::date),
  asistencia     numeric,
  participacion  numeric,
  estado         text not null default 'vigente' check (estado in ('vigente', 'anulado')),
  emitido_por    text default (auth.jwt() ->> 'email'),
  enviado_en     timestamptz,
  nota           text not null default '',
  instructor_clave  text not null default '',                -- id del trabajador (instructor) que firma
  instructor_nombre text not null default '',
  direccion_nombre  text not null default '',
  direccion_cargo   text not null default ''
);
alter table public.certificados add column if not exists instructor_clave  text not null default '';
alter table public.certificados add column if not exists instructor_nombre text not null default '';
alter table public.certificados add column if not exists direccion_nombre  text not null default '';
alter table public.certificados add column if not exists direccion_cargo   text not null default '';
create index if not exists certificados_alumno_idx on public.certificados (alumno_id);
create unique index if not exists certificados_unico_idx on public.certificados (matricula_id, tipo, curso_titulo) where estado = 'vigente';
alter table public.certificados enable row level security;
drop policy if exists "certificados_gerente" on public.certificados;
drop policy if exists "certificados_academico" on public.certificados;
create policy "certificados_academico" on public.certificados for all to authenticated
  using (public.es_academico()) with check (public.es_academico());

-- Verificación pública: hay que acertar el documento (DNI/CE o código de alumno) Y el número del documento.
-- Devuelve solo lo necesario; el registro completo sigue oculto.
create or replace function public.verificar_documento(p_doc text, p_codigo text)
returns table (tipo text, alumno_nombre text, curso_titulo text, horas numeric, fecha_inicio date, fecha_fin date, fecha_emision date, estado text)
language sql stable security definer set search_path = public as $$
  select c.tipo, c.alumno_nombre, c.curso_titulo, c.horas, c.fecha_inicio, c.fecha_fin, c.fecha_emision, c.estado
    from public.certificados c
   where upper(trim(c.codigo)) = upper(trim(p_codigo))
     and length(trim(coalesce(p_doc, ''))) >= 5
     and ( upper(regexp_replace(c.alumno_doc, '\s', '', 'g')) = upper(regexp_replace(p_doc, '\s', '', 'g'))
        or upper(c.alumno_codigo) = upper(trim(p_doc)) )
   limit 1
$$;
revoke all on function public.verificar_documento(text, text) from public;
grant execute on function public.verificar_documento(text, text) to anon, authenticated;

-- FIRMAS REALES (gerencia las cambia): la de Dirección Académica (clave 'direccion') y la de cada instructor (clave = id del trabajador).
create table if not exists public.firmas (
  clave       text primary key,
  nombre      text not null default '',
  cargo       text not null default '',
  imagen      text not null default '',                      -- PNG con fondo transparente (data URL)
  actualizado timestamptz not null default now()
);
alter table public.firmas enable row level security;
drop policy if exists "firmas_gerente" on public.firmas;
create policy "firmas_gerente" on public.firmas for all to authenticated
  using (public.es_gerente()) with check (public.es_gerente());
-- Coordinación académica solo LEE las firmas (para emitir); no las cambia.
drop policy if exists "firmas_ver_academico" on public.firmas;
create policy "firmas_ver_academico" on public.firmas for select to authenticated using (public.es_academico());

-- Instructor de cada grupo, sin tarifas ni datos de pago (la tabla de trabajadores sigue siendo solo de gerencia).
create or replace function public.instructores_de_grupos()
  returns table (grupo_id text, trabajador_id uuid, nombre text)
  language sql stable security definer set search_path = public as $$
  select a.grupo_id, t.id, t.nombre
  from public.asignaciones a join public.trabajadores t on t.id = a.trabajador_id
  where public.es_academico()
$$;
revoke all on function public.instructores_de_grupos() from public, anon;
grant execute on function public.instructores_de_grupos() to authenticated;
