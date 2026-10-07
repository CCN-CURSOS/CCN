-- CCN · Tabla de solicitudes de información (formulario de la web)
-- Pégalo UNA sola vez en Supabase > SQL Editor > Run.
-- No toca cursos, grupos ni enlaces. NO vuelvas a pegar schema.sql.

create table if not exists public.consultas (
  id               uuid primary key default gen_random_uuid(),
  creado           timestamptz not null default now(),
  nombres          text not null check (char_length(nombres) between 2 and 80),
  apellido_paterno text not null check (char_length(apellido_paterno) between 2 and 80),
  apellido_materno text not null check (char_length(apellido_materno) between 2 and 80),
  email            text not null check (char_length(email) between 5 and 120),
  tipo_doc         text not null check (tipo_doc in ('DNI','CE')),
  documento        text not null check (char_length(documento) between 8 and 12),
  celular          text not null check (char_length(celular) between 9 and 16),
  modalidad        text not null check (char_length(modalidad) between 1 and 40),
  curso            text not null check (char_length(curso) between 1 and 120),
  otro_tema        text not null default '' check (char_length(otro_tema) <= 200),
  acepta_datos     boolean not null check (acepta_datos = true),
  acepta_adicional boolean not null default false,
  estado           text not null default 'nuevo' check (estado in ('nuevo','atendida'))
);

alter table public.consultas enable row level security;

-- Cualquier visitante puede ENVIAR una solicitud (pero no leerla).
drop policy if exists "consultas_enviar" on public.consultas;
create policy "consultas_enviar" on public.consultas
  for insert to anon, authenticated
  with check (acepta_datos = true and estado = 'nuevo');

-- Solo los administradores pueden VER, marcar o borrar.
drop policy if exists "consultas_admin_ver" on public.consultas;
create policy "consultas_admin_ver" on public.consultas
  for select to authenticated
  using (exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email')));

drop policy if exists "consultas_admin_editar" on public.consultas;
create policy "consultas_admin_editar" on public.consultas
  for update to authenticated
  using (exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email')));

drop policy if exists "consultas_admin_borrar" on public.consultas;
create policy "consultas_admin_borrar" on public.consultas
  for delete to authenticated
  using (exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email')));
