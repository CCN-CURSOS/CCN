-- CCN · CRM (Etapa 1): roles, alumnos, matrículas, pagos, comprobantes, código de grupo e historial
-- Pégalo UNA sola vez en Supabase > SQL Editor > Run. No borra nada de lo que ya tienes.
-- NO vuelvas a pegar schema.sql.

-- 1) ROLES -------------------------------------------------------------------
alter table public.admins add column if not exists rol text not null default 'gerente';
alter table public.admins drop constraint if exists admins_rol_check;
alter table public.admins add constraint admins_rol_check check (rol in ('gerente', 'vendedora'));

create or replace function public.mi_rol() returns text
  language sql stable security definer set search_path = public as $$
  select rol from public.admins where email = (auth.jwt() ->> 'email') limit 1
$$;
create or replace function public.es_gerente() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() = 'gerente', false)
$$;
create or replace function public.es_equipo() returns boolean
  language sql stable security definer set search_path = public as $$
  select public.mi_rol() is not null
$$;

-- Ventas = gerente + vendedora (alumnos, pagos, prospectos). Web = solo gerente (cursos, precios, horarios, enlaces).
create or replace function public.es_ventas() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() in ('gerente', 'vendedora'), false)
$$;
create or replace function public.es_web() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() = 'gerente', false)
$$;

-- gerente    = todo (finanzas, equipo, web y ventas)
-- vendedora  = ventas: prospectos, inscritos, pagos y comprobantes
-- web: cursos, precios, horarios, enlaces y ajustes (solo gerente)
create or replace function public.es_ventas() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() in ('gerente', 'vendedora'), false)
$$;
create or replace function public.es_web() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() = 'gerente', false)
$$;

-- Lo que antes decía "admin" (editar cursos, horarios, enlaces, ajustes e imágenes) ahora es solo gerente.
create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select public.es_web()
$$;

-- Cada persona puede leer su propia fila (para saber su rol al entrar).
drop policy if exists "admins_ver_propia" on public.admins;
create policy "admins_ver_propia" on public.admins
  for select to authenticated using (email = (auth.jwt() ->> 'email'));
-- Solo gerencia ve y maneja al equipo (quién tiene qué rol).
drop policy if exists "admins_gerente_ver" on public.admins;
create policy "admins_gerente_ver" on public.admins for select to authenticated using (public.es_gerente());
drop policy if exists "admins_gerente_crear" on public.admins;
create policy "admins_gerente_crear" on public.admins for insert to authenticated with check (public.es_gerente());
drop policy if exists "admins_gerente_editar" on public.admins;
create policy "admins_gerente_editar" on public.admins for update to authenticated using (public.es_gerente()) with check (public.es_gerente());
drop policy if exists "admins_gerente_borrar" on public.admins;
create policy "admins_gerente_borrar" on public.admins for delete to authenticated using (public.es_gerente());

-- Solo el gerente administra al equipo (agrega o quita usuarios y cambia roles).
drop policy if exists "admins_gerente_ver" on public.admins;
create policy "admins_gerente_ver" on public.admins for select to authenticated using (public.es_gerente());
drop policy if exists "admins_gerente_crear" on public.admins;
create policy "admins_gerente_crear" on public.admins for insert to authenticated with check (public.es_gerente());
drop policy if exists "admins_gerente_editar" on public.admins;
create policy "admins_gerente_editar" on public.admins for update to authenticated using (public.es_gerente()) with check (public.es_gerente());
drop policy if exists "admins_gerente_borrar" on public.admins;
create policy "admins_gerente_borrar" on public.admins for delete to authenticated using (public.es_gerente());

-- El equipo (los tres roles) puede VER todos los cursos y grupos, también los ocultos.
drop policy if exists "cursos_equipo_ver" on public.cursos;
create policy "cursos_equipo_ver" on public.cursos for select to authenticated using (public.es_equipo());
drop policy if exists "grupos_equipo_ver" on public.grupos;
create policy "grupos_equipo_ver" on public.grupos for select to authenticated using (public.es_equipo());

-- 2) CÓDIGO DE GRUPO (G01, G02…) y cupo máximo -------------------------------------
create sequence if not exists public.grupo_codigo_seq;
alter table public.grupos add column if not exists codigo text;
alter table public.grupos add column if not exists maximo integer not null default 20;

do $$
declare r record;
begin
  for r in select id from public.grupos where codigo is null order by inicio nulls last loop
    update public.grupos set codigo = 'G' || lpad(nextval('public.grupo_codigo_seq')::text, 2, '0') where id = r.id;
  end loop;
end $$;
create unique index if not exists grupos_codigo_uq on public.grupos (codigo);

create or replace function public.grupos_poner_codigo() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := 'G' || lpad(nextval('public.grupo_codigo_seq')::text, 2, '0');
  end if;
  return new;
end $$;
drop trigger if exists trg_grupos_codigo on public.grupos;
create trigger trg_grupos_codigo before insert on public.grupos
  for each row execute function public.grupos_poner_codigo();

-- 3) ALUMNOS -----------------------------------------------------------------
create table if not exists public.alumnos (
  id               uuid primary key default gen_random_uuid(),
  creado           timestamptz not null default now(),
  creado_por       text default (auth.jwt() ->> 'email'),
  tipo_doc         text not null default 'DNI' check (tipo_doc in ('DNI', 'CE')),
  documento        text not null check (char_length(documento) between 8 and 12),
  nombres          text not null check (char_length(nombres) between 2 and 80),
  apellido_paterno text not null check (char_length(apellido_paterno) between 2 and 80),
  apellido_materno text not null default '',
  email            text not null default '',
  celular          text not null default '',
  notas            text not null default '',
  unique (tipo_doc, documento)
);

-- 4) MATRÍCULAS (un alumno en un grupo) ------------------------------------------
create table if not exists public.matriculas (
  id                 uuid primary key default gen_random_uuid(),
  creado             timestamptz not null default now(),
  creado_por         text default (auth.jwt() ->> 'email'),
  paquete_id         uuid not null default gen_random_uuid(),
  paquete            text not null default '',
  alumno_id          uuid not null references public.alumnos (id) on delete cascade,
  grupo_id           text not null,
  grupo_codigo       text not null default '',
  curso_id           text not null default '',
  curso_titulo       text not null default '',
  precio             numeric not null check (precio >= 0),
  fecha_inscripcion  date not null default current_date,
  estado             text not null default 'activa' check (estado in ('activa', 'anulada')),
  nota               text not null default ''
);
create index if not exists matriculas_grupo_idx on public.matriculas (grupo_id);
create index if not exists matriculas_alumno_idx on public.matriculas (alumno_id);

-- 5) PAGOS (Pago 1, Pago 2…) con foto del comprobante ----------------------------
create table if not exists public.pagos (
  id               uuid primary key default gen_random_uuid(),
  creado           timestamptz not null default now(),
  creado_por       text default (auth.jwt() ->> 'email'),
  matricula_id     uuid not null references public.matriculas (id) on delete cascade,
  numero           integer not null default 1 check (numero >= 1),
  monto            numeric not null check (monto > 0),
  fecha            date not null default current_date,
  metodo           text not null default 'Yape',
  comprobante_url  text not null default '',
  lote             uuid,
  nota             text not null default ''
);
create index if not exists pagos_matricula_idx on public.pagos (matricula_id);

-- 6) HISTORIAL (qué pasó, quién y cuándo) ----------------------------------------
create table if not exists public.historial (
  id        uuid primary key default gen_random_uuid(),
  creado    timestamptz not null default now(),
  grupo_id  text,
  curso_id  text,
  alumno_id uuid,
  tipo      text not null,
  detalle   text not null,
  usuario   text default (auth.jwt() ->> 'email')
);
create index if not exists historial_grupo_idx on public.historial (grupo_id, creado desc);

-- 7) PERMISOS (RLS) ----------------------------------------------------------------
alter table public.alumnos    enable row level security;
alter table public.matriculas enable row level security;
alter table public.pagos      enable row level security;
alter table public.historial  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['alumnos', 'matriculas', 'pagos'] loop
    execute format('drop policy if exists "%1$s_equipo_ver" on public.%1$s', t);
    execute format('create policy "%1$s_equipo_ver" on public.%1$s for select to authenticated using (public.es_ventas())', t);
    execute format('drop policy if exists "%1$s_equipo_crear" on public.%1$s', t);
    execute format('create policy "%1$s_equipo_crear" on public.%1$s for insert to authenticated with check (public.es_ventas())', t);
    execute format('drop policy if exists "%1$s_equipo_editar" on public.%1$s', t);
    execute format('create policy "%1$s_equipo_editar" on public.%1$s for update to authenticated using (public.es_ventas()) with check (public.es_ventas())', t);
    execute format('drop policy if exists "%1$s_gerente_borrar" on public.%1$s', t);
    execute format('create policy "%1$s_gerente_borrar" on public.%1$s for delete to authenticated using (public.es_gerente())', t);
  end loop;
end $$;

drop policy if exists "historial_equipo_ver" on public.historial;
create policy "historial_equipo_ver" on public.historial for select to authenticated using (public.es_ventas());
-- Nadie escribe el historial a mano: lo llenan los automáticos de abajo.

-- 8) AUTOMÁTICOS: inscritos del grupo, lleno/abierto e historial -------------------
create or replace function public.anotar_historial(p_grupo text, p_curso text, p_alumno uuid, p_tipo text, p_detalle text)
  returns void language sql security definer set search_path = public as $$
  insert into public.historial (grupo_id, curso_id, alumno_id, tipo, detalle) values (p_grupo, p_curso, p_alumno, p_tipo, p_detalle)
$$;

create or replace function public.sync_inscritos() returns trigger
  language plpgsql security definer set search_path = public as $$
declare gid text; n integer;
begin
  gid := coalesce(new.grupo_id, old.grupo_id);
  select count(*) into n from public.matriculas where grupo_id = gid and estado = 'activa';
  update public.grupos g set
    inscritos = n,
    estado = case
      when g.estado = 'cerrado' then g.estado
      when n >= g.maximo then 'lleno'
      when g.estado = 'lleno' then 'abierto'
      else g.estado end
  where g.id::text = gid;
  return null;
end $$;
drop trigger if exists trg_matriculas_sync on public.matriculas;
create trigger trg_matriculas_sync after insert or update or delete on public.matriculas
  for each row execute function public.sync_inscritos();

create or replace function public.log_matricula() returns trigger
  language plpgsql security definer set search_path = public as $$
declare nom text;
begin
  select nombres || ' ' || apellido_paterno into nom from public.alumnos where id = coalesce(new.alumno_id, old.alumno_id);
  if tg_op = 'INSERT' then
    perform public.anotar_historial(new.grupo_id, new.curso_id, new.alumno_id, 'inscripcion', 'Inscrito: ' || coalesce(nom, '—') || ' en ' || new.grupo_codigo || ' (S/ ' || new.precio || ')');
  elsif tg_op = 'UPDATE' and old.estado <> new.estado then
    perform public.anotar_historial(new.grupo_id, new.curso_id, new.alumno_id, 'matricula', coalesce(nom, '—') || ': matrícula ' || new.estado || ' en ' || new.grupo_codigo);
  elsif tg_op = 'DELETE' then
    perform public.anotar_historial(old.grupo_id, old.curso_id, old.alumno_id, 'matricula', 'Matrícula borrada: ' || coalesce(nom, '—') || ' en ' || old.grupo_codigo);
  end if;
  return null;
end $$;
drop trigger if exists trg_matriculas_log on public.matriculas;
create trigger trg_matriculas_log after insert or update or delete on public.matriculas
  for each row execute function public.log_matricula();

create or replace function public.log_pago() returns trigger
  language plpgsql security definer set search_path = public as $$
declare m record; nom text;
begin
  select * into m from public.matriculas where id = new.matricula_id;
  select nombres || ' ' || apellido_paterno into nom from public.alumnos where id = m.alumno_id;
  perform public.anotar_historial(m.grupo_id, m.curso_id, m.alumno_id, 'pago', 'Pago ' || new.numero || ': ' || coalesce(nom, '—') || ' S/ ' || round(new.monto, 2) || ' (' || new.metodo || ') en ' || m.grupo_codigo);
  return null;
end $$;
drop trigger if exists trg_pagos_log on public.pagos;
create trigger trg_pagos_log after insert on public.pagos
  for each row execute function public.log_pago();

create or replace function public.log_grupo() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.anotar_historial(new.id::text, new.curso_id::text, null, 'grupo', 'Grupo ' || new.codigo || ' creado' || coalesce(' · inicio ' || new.inicio::text, ''));
  elsif tg_op = 'UPDATE' then
    if old.estado is distinct from new.estado then
      perform public.anotar_historial(new.id::text, new.curso_id::text, null, 'grupo', new.codigo || ': estado ' || old.estado || ' → ' || new.estado);
    end if;
    if old.inicio is distinct from new.inicio then
      perform public.anotar_historial(new.id::text, new.curso_id::text, null, 'grupo', new.codigo || ': inicio ' || coalesce(old.inicio::text, 'sin fecha') || ' → ' || coalesce(new.inicio::text, 'sin fecha'));
    end if;
    if old.dias is distinct from new.dias or old.horario is distinct from new.horario then
      perform public.anotar_historial(new.id::text, new.curso_id::text, null, 'grupo', new.codigo || ': horario ' || coalesce(new.dias, '') || ' ' || coalesce(new.horario, ''));
    end if;
  end if;
  return null;
end $$;
drop trigger if exists trg_grupos_log on public.grupos;
create trigger trg_grupos_log after insert or update on public.grupos
  for each row execute function public.log_grupo();

-- Prospectos y consultas: los ven y marcan gerente y vendedora.
drop policy if exists "interesados_admin_ver" on public.interesados;
create policy "interesados_admin_ver" on public.interesados for select to authenticated using (public.es_ventas());
drop policy if exists "interesados_admin_editar" on public.interesados;
create policy "interesados_admin_editar" on public.interesados for update to authenticated using (public.es_ventas()) with check (public.es_ventas());
drop policy if exists "consultas_admin_ver" on public.consultas;
create policy "consultas_admin_ver" on public.consultas for select to authenticated using (public.es_ventas());
drop policy if exists "consultas_admin_editar" on public.consultas;
create policy "consultas_admin_editar" on public.consultas for update to authenticated using (public.es_ventas()) with check (public.es_ventas());
-- Solo gerencia borra.
drop policy if exists "interesados_admin_borrar" on public.interesados;
create policy "interesados_admin_borrar" on public.interesados for delete to authenticated using (public.es_gerente());
drop policy if exists "consultas_admin_borrar" on public.consultas;
create policy "consultas_admin_borrar" on public.consultas for delete to authenticated using (public.es_gerente());

-- 9) COMPROBANTES: carpeta PRIVADA (solo el equipo ve las fotos) -----------------------
insert into storage.buckets (id, name, public) values ('comprobantes', 'comprobantes', false)
  on conflict (id) do nothing;

drop policy if exists "comprobantes_equipo_subir" on storage.objects;
create policy "comprobantes_equipo_subir" on storage.objects
  for insert to authenticated with check (bucket_id = 'comprobantes' and public.es_ventas());
drop policy if exists "comprobantes_equipo_ver" on storage.objects;
create policy "comprobantes_equipo_ver" on storage.objects
  for select to authenticated using (bucket_id = 'comprobantes' and public.es_ventas());
drop policy if exists "comprobantes_gerente_borrar" on storage.objects;
create policy "comprobantes_gerente_borrar" on storage.objects
  for delete to authenticated using (bucket_id = 'comprobantes' and public.es_gerente());

-- 10) Para dar acceso, crea el usuario en Authentication > Users (Auto Confirm) y luego, desde el panel (módulo Gerencia > Equipo)
--     o con SQL:  insert into public.admins (email, rol) values ('correo@gmail.com', 'vendedora');   -- o 'gerente'
-- Tu cuenta y la de tu socio quedan como 'gerente' (es el valor por defecto).


-- ===================================================================================
-- 11) MÓDULO DE VENTAS POR VENDEDOR (cada vendedor ve lo suyo; el gerente ve todo)
-- ===================================================================================

-- 11a) Interesados de la web: seguimiento del vendedor (contactó / contestó / observación)
alter table public.interesados add column if not exists contesto        boolean;
alter table public.interesados add column if not exists observacion     text not null default '';
alter table public.interesados add column if not exists contactado_por  text;
alter table public.interesados add column if not exists contactado_en   timestamptz;

-- 11b) Cada matrícula queda marcada con el vendedor que la registró
alter table public.matriculas add column if not exists vendedor text default (auth.jwt() ->> 'email');
update public.matriculas set vendedor = creado_por where vendedor is null;

drop policy if exists "matriculas_equipo_ver" on public.matriculas;
create policy "matriculas_equipo_ver" on public.matriculas for select to authenticated
  using (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')));
drop policy if exists "matriculas_equipo_editar" on public.matriculas;
create policy "matriculas_equipo_editar" on public.matriculas for update to authenticated
  using (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')))
  with check (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')));

drop policy if exists "pagos_equipo_ver" on public.pagos;
create policy "pagos_equipo_ver" on public.pagos for select to authenticated
  using (public.es_gerente() or exists (select 1 from public.matriculas m where m.id = matricula_id and m.vendedor = (auth.jwt() ->> 'email')));
drop policy if exists "pagos_equipo_editar" on public.pagos;
create policy "pagos_equipo_editar" on public.pagos for update to authenticated
  using (public.es_gerente() or exists (select 1 from public.matriculas m where m.id = matricula_id and m.vendedor = (auth.jwt() ->> 'email')))
  with check (public.es_gerente() or exists (select 1 from public.matriculas m where m.id = matricula_id and m.vendedor = (auth.jwt() ->> 'email')));

-- El historial completo es solo del gerente
drop policy if exists "historial_equipo_ver" on public.historial;
create policy "historial_equipo_ver" on public.historial for select to authenticated using (public.es_gerente());

-- (Los alumnos siguen visibles para ventas solo para detectar duplicados por DNI;
--  el panel de cada vendedor muestra únicamente SUS inscripciones.)

-- 11c) Prospectos: la base propia de cada vendedor
create table if not exists public.prospectos (
  id            uuid primary key default gen_random_uuid(),
  creado        timestamptz not null default now(),
  vendedor      text not null default (auth.jwt() ->> 'email'),
  nombres       text not null check (char_length(nombres) between 2 and 120),
  celular       text not null default '',
  curso         text not null default '',
  origen        text not null default 'WhatsApp',
  estado        text not null default 'nuevo' check (estado in ('nuevo', 'contactado', 'esperando_pago', 'inscrito', 'perdido')),
  seguimiento   date,
  notas         text not null default ''
);
create index if not exists prospectos_vendedor_idx on public.prospectos (vendedor);
alter table public.prospectos enable row level security;

drop policy if exists "prospectos_ver" on public.prospectos;
create policy "prospectos_ver" on public.prospectos for select to authenticated
  using (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')));
drop policy if exists "prospectos_crear" on public.prospectos;
create policy "prospectos_crear" on public.prospectos for insert to authenticated
  with check (public.es_ventas() and vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "prospectos_editar" on public.prospectos;
create policy "prospectos_editar" on public.prospectos for update to authenticated
  using (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')))
  with check (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')));
drop policy if exists "prospectos_borrar" on public.prospectos;
create policy "prospectos_borrar" on public.prospectos for delete to authenticated
  using (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')));


-- ===================================================================================
-- 12) REPARTO AUTOMÁTICO DE INTERESADOS ENTRE VENDEDORES
--     Cada interesado nuevo se deriva solo a la vendedora que lleva más tiempo sin recibir uno.
--     Cada vendedor ve únicamente los que le tocaron. El gerente ve todos, reasigna y audita.
-- ===================================================================================
alter table public.admins      add column if not exists recibe_interesados boolean not null default true;
alter table public.interesados add column if not exists asignado_a  text;
alter table public.interesados add column if not exists asignado_en timestamptz;

create or replace function public.elegir_vendedora() returns text
  language sql stable security definer set search_path = public as $$
  select a.email from public.admins a
  where a.rol = 'vendedora' and a.recibe_interesados
  order by (select max(i.asignado_en) from public.interesados i where i.asignado_a = a.email) asc nulls first, a.email
  limit 1
$$;

create or replace function public.derivar_interesado() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.asignado_a  := public.elegir_vendedora();       -- nadie puede elegir a quién le toca desde la web
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

-- Cuando entra una vendedora nueva, los interesados que quedaron sin asignar pasan a ella
create or replace function public.al_agregar_vendedora() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.rol = 'vendedora' and new.recibe_interesados then
    update public.interesados set asignado_a = new.email, asignado_en = now() where asignado_a is null;
  end if;
  return new;
end $$;
drop trigger if exists trg_admins_vendedora on public.admins;
create trigger trg_admins_vendedora after insert on public.admins
  for each row execute function public.al_agregar_vendedora();

-- Los interesados que ya existían se asignan a la primera vendedora (si ya hay una)
update public.interesados set asignado_a = public.elegir_vendedora(), asignado_en = now() where asignado_a is null;

-- Cada vendedor solo ve y trabaja los interesados que le tocaron
drop policy if exists "interesados_admin_ver" on public.interesados;
create policy "interesados_admin_ver" on public.interesados for select to authenticated
  using (public.es_gerente() or (public.es_ventas() and asignado_a = (auth.jwt() ->> 'email')));
drop policy if exists "interesados_admin_editar" on public.interesados;
create policy "interesados_admin_editar" on public.interesados for update to authenticated
  using (public.es_gerente() or (public.es_ventas() and asignado_a = (auth.jwt() ->> 'email')))
  with check (public.es_gerente() or (public.es_ventas() and asignado_a = (auth.jwt() ->> 'email')));


-- ===================================================================================
-- 13) TRABAJADORES (solo gerente; cada vendedor puede leer SU propia ficha: sueldo y tramos)
-- ===================================================================================
create table if not exists public.trabajadores (
  id               uuid primary key default gen_random_uuid(),
  creado           timestamptz not null default now(),
  nombre           text not null check (char_length(nombre) between 2 and 120),
  puesto           text not null default 'vendedor' check (puesto in ('vendedor', 'instructor', 'otro')),
  cargo            text not null default '',
  email            text unique,
  sueldo_base      numeric not null default 0 check (sueldo_base >= 0),
  comision_tramos  jsonb not null default '[{"desde":0,"pct":3},{"desde":10,"pct":4},{"desde":15,"pct":5}]'::jsonb,
  activo           boolean not null default true,
  notas            text not null default ''
);
alter table public.trabajadores enable row level security;

drop policy if exists "trabajadores_ver" on public.trabajadores;
create policy "trabajadores_ver" on public.trabajadores for select to authenticated
  using (public.es_gerente() or email = (auth.jwt() ->> 'email'));
drop policy if exists "trabajadores_gerente" on public.trabajadores;
create policy "trabajadores_gerente" on public.trabajadores for all to authenticated
  using (public.es_gerente()) with check (public.es_gerente());


-- ===================================================================================
-- 14) GRUPOS DE WHATSAPP (los crea ventas apenas se abre un grupo; el enlace NO es público)
-- ===================================================================================
create table if not exists public.grupos_whatsapp (
  grupo_id    text primary key,
  nombre      text not null check (char_length(nombre) between 3 and 120),
  enlace      text not null check (enlace ~* '^https://chat\.whatsapp\.com/'),
  creado_por  text default (auth.jwt() ->> 'email'),
  creado      timestamptz not null default now()
);
alter table public.grupos_whatsapp enable row level security;
drop policy if exists "gwa_ver" on public.grupos_whatsapp;
create policy "gwa_ver" on public.grupos_whatsapp for select to authenticated using (public.es_equipo());
drop policy if exists "gwa_crear" on public.grupos_whatsapp;
create policy "gwa_crear" on public.grupos_whatsapp for insert to authenticated with check (public.es_ventas());
drop policy if exists "gwa_editar" on public.grupos_whatsapp;
create policy "gwa_editar" on public.grupos_whatsapp for update to authenticated using (public.es_ventas()) with check (public.es_ventas());
drop policy if exists "gwa_borrar" on public.grupos_whatsapp;
create policy "gwa_borrar" on public.grupos_whatsapp for delete to authenticated using (public.es_gerente());


-- ===================================================================================
-- 15) PROFESORES: cursos que dictan, grupos asignados, horas dictadas y pagos (solo gerente)
--     Va en tablas aparte porque la web pública NO debe mostrar quién enseña ni cuánto se paga.
-- ===================================================================================
alter table public.trabajadores add column if not exists documento    text not null default '';
alter table public.trabajadores add column if not exists celular      text not null default '';
alter table public.trabajadores add column if not exists tarifa_hora  numeric not null default 0 check (tarifa_hora >= 0);
alter table public.trabajadores add column if not exists cursos       jsonb not null default '[]'::jsonb;

create table if not exists public.asignaciones (
  id              uuid primary key default gen_random_uuid(),
  creado          timestamptz not null default now(),
  grupo_id        text not null unique,
  trabajador_id   uuid not null references public.trabajadores (id) on delete cascade,
  horas           numeric not null default 0 check (horas >= 0),
  horas_dictadas  numeric not null default 0 check (horas_dictadas >= 0),
  tarifa_hora     numeric not null default 0 check (tarifa_hora >= 0),
  nota            text not null default ''
);
create table if not exists public.pagos_trabajador (
  id              uuid primary key default gen_random_uuid(),
  creado          timestamptz not null default now(),
  trabajador_id   uuid not null references public.trabajadores (id) on delete cascade,
  asignacion_id   uuid references public.asignaciones (id) on delete set null,
  monto           numeric not null check (monto > 0),
  fecha           date not null default current_date,
  metodo          text not null default '',
  nota            text not null default ''
);
alter table public.asignaciones     enable row level security;
alter table public.pagos_trabajador enable row level security;
drop policy if exists "asignaciones_gerente" on public.asignaciones;
create policy "asignaciones_gerente" on public.asignaciones for all to authenticated using (public.es_gerente()) with check (public.es_gerente());
drop policy if exists "pagos_trabajador_gerente" on public.pagos_trabajador;
create policy "pagos_trabajador_gerente" on public.pagos_trabajador for all to authenticated using (public.es_gerente()) with check (public.es_gerente());


-- ===================================================================================
-- 16) INSTALACIONES REMOTAS (las agenda ventas; solo en los horarios disponibles del instalador)
--     Lun–Vie 7:00 p. m. a 11:00 p. m. · Sáb 3:00 p. m. a 11:00 p. m. · Dom todo el día (8:00 a. m. a 11:00 p. m.)
--     Cada instalación dura ~1 hora, así que la última hora de inicio es las 10:00 p. m.
-- ===================================================================================
create table if not exists public.instalaciones (
  id             uuid primary key default gen_random_uuid(),
  creado         timestamptz not null default now(),
  vendedor       text not null default (auth.jwt() ->> 'email'),
  alumno_id      uuid references public.alumnos (id) on delete cascade,
  grupo_id       text not null default '',
  grupo_codigo   text not null default '',
  curso_titulo   text not null default '',
  programa       text not null default '',
  fecha          date not null,
  hora           time not null,
  estado         text not null default 'agendada' check (estado in ('agendada', 'hecha', 'reprogramada', 'cancelada')),
  nota           text not null default ''
);
create index if not exists instalaciones_fecha_idx on public.instalaciones (fecha);

create or replace function public.validar_instalacion() returns trigger
  language plpgsql as $$
declare dow int; h numeric;
begin
  if new.estado <> 'agendada' then return new; end if;
  dow := extract(dow from new.fecha);                    -- 0 = domingo
  h := extract(hour from new.hora) + extract(minute from new.hora) / 60.0;
  if dow between 1 and 5 and (h < 19 or h > 22) then raise exception 'De lunes a viernes las instalaciones son de 7:00 p. m. a 11:00 p. m.'; end if;
  if dow = 6 and (h < 15 or h > 22) then raise exception 'Los sábados las instalaciones son de 3:00 p. m. a 11:00 p. m.'; end if;
  if dow = 0 and (h < 8 or h > 22) then raise exception 'Los domingos las instalaciones son de 8:00 a. m. a 11:00 p. m.'; end if;
  return new;
end $$;
drop trigger if exists trg_instalaciones_validar on public.instalaciones;
create trigger trg_instalaciones_validar before insert or update on public.instalaciones
  for each row execute function public.validar_instalacion();

alter table public.instalaciones enable row level security;
drop policy if exists "inst_ver" on public.instalaciones;
create policy "inst_ver" on public.instalaciones for select to authenticated
  using (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')));
drop policy if exists "inst_crear" on public.instalaciones;
create policy "inst_crear" on public.instalaciones for insert to authenticated
  with check (public.es_ventas() and vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "inst_editar" on public.instalaciones;
create policy "inst_editar" on public.instalaciones for update to authenticated
  using (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')))
  with check (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')));
drop policy if exists "inst_borrar" on public.instalaciones;
create policy "inst_borrar" on public.instalaciones for delete to authenticated
  using (public.es_gerente() or (public.es_ventas() and vendedor = (auth.jwt() ->> 'email')));


-- ===================================================================================
-- 17) CÓDIGO ÚNICO DE ALUMNO:  AÑO-CORRELATIVO-MES-ÚLTIMOS 3 DEL DNI   (ej. 2026-000-10-678)
--     · AÑO y MES: de cuando se registra el alumno (hora de Lima).
--     · CORRELATIVO: 000, 001, 002… dentro de cada mes (se reinicia cada mes).
--     · ÚLTIMOS 3 DEL DNI: los 3 últimos números de su documento.
--     Lo asigna la base de datos al registrar al alumno; nadie lo escribe ni lo puede cambiar.
--     Es el identificador que usa todo el equipo (en vez del DNI) y evita confundir homónimos.
-- ===================================================================================
alter table public.alumnos add column if not exists codigo text;

create table if not exists public.alumno_contadores (periodo text primary key, n integer not null default 0);
alter table public.alumno_contadores enable row level security;       -- sin políticas: solo lo usa el sistema

create or replace function public.codigo_alumno(p_fecha timestamptz, p_documento text) returns text
  language plpgsql security definer set search_path = public as $$
declare per text; v integer;
begin
  per := to_char(p_fecha at time zone 'America/Lima', 'YYYY-MM');
  insert into public.alumno_contadores (periodo, n) values (per, 0)
    on conflict (periodo) do update set n = public.alumno_contadores.n + 1
    returning public.alumno_contadores.n into v;
  return substr(per, 1, 4) || '-' || lpad(v::text, 3, '0') || '-' || substr(per, 6, 2) || '-' ||
         right('000' || regexp_replace(coalesce(p_documento, ''), '\D', '', 'g'), 3);
end $$;

-- Alumnos que ya existían (o con un código de una versión anterior): se numeran por orden de registro
do $$
declare r record;
begin
  for r in select id, creado, documento from public.alumnos where codigo is null or codigo like 'AL-%' order by creado, id loop
    update public.alumnos set codigo = public.codigo_alumno(r.creado, r.documento) where id = r.id;
  end loop;
end $$;

create or replace function public.poner_codigo_alumno() returns trigger
  language plpgsql as $$
begin
  new.codigo := public.codigo_alumno(now(), new.documento);            -- siempre lo decide el sistema
  return new;
end $$;
drop trigger if exists trg_alumnos_codigo on public.alumnos;
create trigger trg_alumnos_codigo before insert on public.alumnos
  for each row execute function public.poner_codigo_alumno();

-- Nadie puede cambiar el código de un alumno después
create or replace function public.fijar_codigo_alumno() returns trigger
  language plpgsql as $$
begin
  new.codigo := old.codigo;
  return new;
end $$;
drop trigger if exists trg_alumnos_codigo_fijo on public.alumnos;
create trigger trg_alumnos_codigo_fijo before update on public.alumnos
  for each row execute function public.fijar_codigo_alumno();

create unique index if not exists alumnos_codigo_uq on public.alumnos (codigo);


-- ===================================================================================
-- 18) FICHA POR CURSO: enlace al brochure (PDF) de cada curso
-- ===================================================================================
alter table public.cursos add column if not exists brochure_url text not null default '';


-- ===================================================================================
-- 19) ACCESOS: bóveda de cuentas y contraseñas. SOLO el gerente la ve y la edita.
-- ===================================================================================
create table if not exists public.accesos (
  id        uuid primary key default gen_random_uuid(),
  creado    timestamptz not null default now(),
  servicio  text not null check (char_length(servicio) between 1 and 120),
  categoria text not null default 'Otros',
  url       text not null default '',
  usuario   text not null default '',
  clave     text not null default '',
  notas     text not null default ''
);
alter table public.accesos enable row level security;
drop policy if exists "accesos_gerente" on public.accesos;
create policy "accesos_gerente" on public.accesos for all to authenticated
  using (public.es_gerente()) with check (public.es_gerente());


-- ===================================================================================
-- 20) Fecha de inicio del trabajador (desde ahí se calcula su pago)
-- ===================================================================================
alter table public.trabajadores add column if not exists fecha_inicio date;


-- ===================================================================================
-- 21) Metas (hitos) por trabajador: [{"fecha":"2026-10-26","cupos":3,"cursos":1}, ...]
-- ===================================================================================
alter table public.trabajadores add column if not exists metas jsonb;


-- ===================================================================================
-- 22) Regla de ventas: antes de inscribir se envían Términos y condiciones y, si el curso
--     instala software, los requisitos mínimos de PC. Queda registrado en cada matrícula.
-- ===================================================================================
alter table public.matriculas add column if not exists terminos_enviados boolean not null default false;
alter table public.matriculas add column if not exists requisitos_enviados boolean not null default false;


-- ===================================================================================
-- 23) JORNADAS: la vendedora inicia y termina su jornada; el gerente ve las horas por semana.
--     Mínimo: 24 h por semana (4 h al día, lunes a sábado); puede trabajar más. Sin señal por más de 15 min = se cierra sola.
-- ===================================================================================
create table if not exists public.jornadas (
  id            uuid primary key default gen_random_uuid(),
  creado        timestamptz not null default now(),
  vendedor      text not null,
  inicio        timestamptz not null default now(),
  fin           timestamptz,
  ultimo_pulso  timestamptz not null default now(),
  estado        text not null default 'abierta' check (estado in ('abierta','cerrada','interrumpida')),
  cierre        text not null default '' check (cierre in ('','manual','tope','sin_senal','gerente')),
  dispositivo   text not null default '',
  nota          text not null default ''
);
create unique index if not exists jornadas_una_abierta on public.jornadas (vendedor) where estado = 'abierta';
create index if not exists jornadas_vendedor_inicio on public.jornadas (vendedor, inicio desc);
alter table public.jornadas enable row level security;

drop policy if exists "jornadas_ver" on public.jornadas;
create policy "jornadas_ver" on public.jornadas for select to authenticated
  using (public.es_gerente() or vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "jornadas_crear" on public.jornadas;
create policy "jornadas_crear" on public.jornadas for insert to authenticated
  with check (public.es_ventas() and (public.es_gerente() or vendedor = (auth.jwt() ->> 'email')));
drop policy if exists "jornadas_editar" on public.jornadas;
create policy "jornadas_editar" on public.jornadas for update to authenticated
  using (public.es_gerente() or (vendedor = (auth.jwt() ->> 'email') and estado = 'abierta'))
  with check (public.es_gerente() or vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "jornadas_borrar" on public.jornadas;
create policy "jornadas_borrar" on public.jornadas for delete to authenticated using (public.es_gerente());

-- La vendedora no puede cambiar horas: el servidor pone la hora de inicio, de pulso y de fin.
create or replace function public.proteger_jornada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.es_gerente() then return new; end if;
  if tg_op = 'INSERT' then
    new.vendedor := (auth.jwt() ->> 'email');
    new.inicio := now(); new.ultimo_pulso := now(); new.fin := null;
    new.estado := 'abierta'; new.cierre := ''; new.nota := '';
    return new;
  end if;
  -- UPDATE (solo mientras está abierta)
  new.vendedor := old.vendedor; new.inicio := old.inicio; new.nota := old.nota; new.dispositivo := old.dispositivo;
  if new.estado = 'abierta' then
    new.ultimo_pulso := now(); new.fin := null; new.cierre := '';
  elsif new.estado = 'cerrada' then
    new.fin := now(); new.ultimo_pulso := old.ultimo_pulso;
    if new.cierre not in ('manual','tope') then new.cierre := 'manual'; end if;
  else
    new.estado := 'interrumpida'; new.fin := old.ultimo_pulso; new.ultimo_pulso := old.ultimo_pulso; new.cierre := 'sin_senal';
  end if;
  return new;
end $$;
drop trigger if exists trg_proteger_jornada on public.jornadas;
create trigger trg_proteger_jornada before insert or update on public.jornadas
  for each row execute function public.proteger_jornada();


-- ===================================================================================
-- 24) AGENDA de la vendedora: contactos 1 y 2 en prospectos, pendientes y notas
-- ===================================================================================
alter table public.prospectos add column if not exists contacto1_fecha date;
alter table public.prospectos add column if not exists contacto1_obs text not null default '';
alter table public.prospectos add column if not exists recontactar1 text not null default '';
alter table public.prospectos add column if not exists recontactar1_fecha date;
alter table public.prospectos add column if not exists contacto2_fecha date;
alter table public.prospectos add column if not exists contacto2_obs text not null default '';
alter table public.prospectos add column if not exists recontactar2 text not null default '';
alter table public.prospectos add column if not exists recontactar2_fecha date;
alter table public.prospectos add column if not exists recontacto2_hecho boolean not null default false;
alter table public.prospectos drop constraint if exists prospectos_recontactar_check;
alter table public.prospectos add constraint prospectos_recontactar_check
  check (recontactar1 in ('','si','no') and recontactar2 in ('','si','no'));

create table if not exists public.pendientes (
  id            uuid primary key default gen_random_uuid(),
  creado        timestamptz not null default now(),
  vendedor      text not null,
  creado_por    text not null default '',
  titulo        text not null check (char_length(titulo) between 1 and 160),
  detalle       text not null default '',
  fecha_limite  date,
  estado        text not null default 'pendiente' check (estado in ('pendiente','realizado')),
  realizado_en  timestamptz
);
create index if not exists pendientes_vendedor_idx on public.pendientes (vendedor, estado);
alter table public.pendientes enable row level security;
drop policy if exists "pendientes_ver" on public.pendientes;
create policy "pendientes_ver" on public.pendientes for select to authenticated
  using (public.es_gerente() or vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "pendientes_crear" on public.pendientes;
create policy "pendientes_crear" on public.pendientes for insert to authenticated
  with check (public.es_ventas() and (public.es_gerente() or vendedor = (auth.jwt() ->> 'email')));
drop policy if exists "pendientes_editar" on public.pendientes;
create policy "pendientes_editar" on public.pendientes for update to authenticated
  using (public.es_gerente() or vendedor = (auth.jwt() ->> 'email'))
  with check (public.es_gerente() or vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "pendientes_borrar" on public.pendientes;
create policy "pendientes_borrar" on public.pendientes for delete to authenticated
  using (public.es_gerente() or (vendedor = (auth.jwt() ->> 'email') and creado_por = vendedor));

-- Un pendiente realizado ya no se edita ni se borra (ni siquiera el gerente).
create or replace function public.proteger_pendiente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.estado = 'realizado' then raise exception 'Un pendiente realizado ya no se puede borrar.'; end if;
    return old;
  end if;
  if tg_op = 'INSERT' then
    if not public.es_gerente() then
      new.vendedor := (auth.jwt() ->> 'email'); new.estado := 'pendiente'; new.realizado_en := null;
    end if;
    new.creado_por := (auth.jwt() ->> 'email');
    return new;
  end if;
  if old.estado = 'realizado' then raise exception 'Un pendiente realizado ya no se puede editar.'; end if;
  if new.estado = 'realizado' then new.realizado_en := now(); else new.realizado_en := null; end if;
  if not public.es_gerente() then
    new.vendedor := old.vendedor; new.creado_por := old.creado_por;
    if old.creado_por <> old.vendedor then
      new.titulo := old.titulo; new.detalle := old.detalle; new.fecha_limite := old.fecha_limite;  -- asignado por gerencia: solo puede marcarlo
    end if;
  else
    new.creado_por := old.creado_por;
  end if;
  return new;
end $$;
drop trigger if exists trg_proteger_pendiente on public.pendientes;
create trigger trg_proteger_pendiente before insert or update or delete on public.pendientes
  for each row execute function public.proteger_pendiente();

create table if not exists public.notas_agenda (
  id          uuid primary key default gen_random_uuid(),
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  vendedor    text not null default (auth.jwt() ->> 'email'),
  titulo      text not null default '',
  texto       text not null default ''
);
alter table public.notas_agenda enable row level security;
drop policy if exists "notas_ver" on public.notas_agenda;
create policy "notas_ver" on public.notas_agenda for select to authenticated
  using (public.es_gerente() or vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "notas_propias" on public.notas_agenda;
create policy "notas_propias" on public.notas_agenda for all to authenticated
  using (vendedor = (auth.jwt() ->> 'email') and public.es_ventas())
  with check (vendedor = (auth.jwt() ->> 'email') and public.es_ventas());


-- ===================================================================================
-- 25) CONTRATOS: plantillas editables y documentos enviados a cada trabajador
-- ===================================================================================
create table if not exists public.plantillas_doc (
  tipo        text primary key check (tipo in ('contrato','confidencialidad','plan')),
  titulo      text not null,
  contenido   text not null,
  actualizado timestamptz not null default now()
);
alter table public.plantillas_doc enable row level security;
drop policy if exists "plantillas_ver" on public.plantillas_doc;
create policy "plantillas_ver" on public.plantillas_doc for select to authenticated using (public.es_ventas());
drop policy if exists "plantillas_gerente" on public.plantillas_doc;
create policy "plantillas_gerente" on public.plantillas_doc for all to authenticated
  using (public.es_gerente()) with check (public.es_gerente());

create table if not exists public.documentos_trab (
  id             uuid primary key default gen_random_uuid(),
  creado         timestamptz not null default now(),
  vendedor       text not null,
  tipo           text not null check (tipo in ('contrato','confidencialidad')),
  titulo         text not null,
  contenido      text not null,
  fecha_inicio   date,
  fecha_fin      date,
  estado         text not null default 'enviado' check (estado in ('enviado','firmado')),
  firmado_nombre text not null default '',
  firmado_en     timestamptz,
  huella         text not null default '',
  enviado_por    text not null default ''
);
create index if not exists documentos_trab_vendedor_idx on public.documentos_trab (vendedor, estado);
alter table public.documentos_trab enable row level security;
drop policy if exists "docs_ver" on public.documentos_trab;
create policy "docs_ver" on public.documentos_trab for select to authenticated
  using (public.es_gerente() or vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "docs_enviar" on public.documentos_trab;
create policy "docs_enviar" on public.documentos_trab for insert to authenticated with check (public.es_gerente());
drop policy if exists "docs_firmar" on public.documentos_trab;
create policy "docs_firmar" on public.documentos_trab for update to authenticated
  using (estado = 'enviado' and (public.es_gerente() or vendedor = (auth.jwt() ->> 'email')))
  with check (public.es_gerente() or vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "docs_borrar" on public.documentos_trab;
create policy "docs_borrar" on public.documentos_trab for delete to authenticated using (public.es_gerente() and estado = 'enviado');

-- La firma: el servidor pone fecha y huella; el contenido no cambia una vez enviado.
create or replace function public.proteger_documento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.estado := 'enviado'; new.firmado_nombre := ''; new.firmado_en := null; new.huella := '';
    new.enviado_por := (auth.jwt() ->> 'email'); return new;
  end if;
  if old.estado = 'firmado' then raise exception 'Un documento firmado ya no se puede modificar.'; end if;
  new.vendedor := old.vendedor; new.tipo := old.tipo; new.titulo := old.titulo; new.contenido := old.contenido;
  new.fecha_inicio := old.fecha_inicio; new.fecha_fin := old.fecha_fin; new.enviado_por := old.enviado_por; new.creado := old.creado;
  if new.estado = 'firmado' then
    if char_length(btrim(new.firmado_nombre)) < 5 then raise exception 'Escribe tu nombre completo para firmar.'; end if;
    new.firmado_en := now();
    new.huella := encode(sha256(convert_to(old.contenido || '|' || new.firmado_nombre || '|' || new.firmado_en::text || '|' || old.vendedor, 'UTF8')), 'hex');
  else
    new.firmado_nombre := ''; new.firmado_en := null; new.huella := '';
  end if;
  return new;
end $$;
drop trigger if exists trg_proteger_documento on public.documentos_trab;
create trigger trg_proteger_documento before insert or update on public.documentos_trab
  for each row execute function public.proteger_documento();


-- ===================================================================================
-- 26) REGLAS DE VENTA: descuento autorizado, grupo WhatsApp "solo admins", quejas y reclamos
-- ===================================================================================
alter table public.matriculas add column if not exists descuento_autorizado boolean not null default false;
alter table public.matriculas add column if not exists descuento_motivo text not null default '';
alter table public.grupos_whatsapp add column if not exists solo_admins boolean not null default false;

create table if not exists public.quejas (
  id             uuid primary key default gen_random_uuid(),
  creado         timestamptz not null default now(),
  vendedor       text not null default (auth.jwt() ->> 'email'),
  tipo           text not null default 'queja' check (tipo in ('queja','reclamo','problema')),
  alumno         text not null default '',
  celular        text not null default '',
  detalle        text not null check (char_length(detalle) >= 5),
  estado         text not null default 'nueva' check (estado in ('nueva','atendida')),
  nota_gerencia  text not null default '',
  atendido_en    timestamptz
);
alter table public.quejas enable row level security;
drop policy if exists "quejas_ver" on public.quejas;
create policy "quejas_ver" on public.quejas for select to authenticated
  using (public.es_gerente() or vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "quejas_crear" on public.quejas;
create policy "quejas_crear" on public.quejas for insert to authenticated
  with check (public.es_ventas() and vendedor = (auth.jwt() ->> 'email'));
drop policy if exists "quejas_gerente" on public.quejas;
create policy "quejas_gerente" on public.quejas for update to authenticated
  using (public.es_gerente()) with check (public.es_gerente());
drop policy if exists "quejas_borrar" on public.quejas;
create policy "quejas_borrar" on public.quejas for delete to authenticated using (public.es_gerente());
