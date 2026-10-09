-- CCN · Tabla de interesados (formulario de inscripción de cada curso)
-- Pégalo UNA sola vez en Supabase > SQL Editor > Run.
-- No toca cursos, grupos, enlaces ni consultas. NO vuelvas a pegar schema.sql.

create table if not exists public.interesados (
  id               uuid primary key default gen_random_uuid(),
  creado           timestamptz not null default now(),
  curso_id         text not null,
  curso            text not null check (char_length(curso) between 1 and 120),
  lista_espera     boolean not null default false,
  inicio           text not null default '',
  nombres          text not null check (char_length(nombres) between 2 and 80),
  apellido_paterno text not null check (char_length(apellido_paterno) between 2 and 80),
  apellido_materno text not null check (char_length(apellido_materno) between 2 and 80),
  email            text not null check (char_length(email) between 5 and 120),
  tipo_doc         text not null check (tipo_doc in ('DNI','CE')),
  documento        text not null check (char_length(documento) between 8 and 12),
  celular          text not null check (char_length(celular) between 9 and 16),
  acepta_datos     boolean not null check (acepta_datos = true),
  acepta_adicional boolean not null default false,
  estado           text not null default 'nuevo' check (estado in ('nuevo','atendida'))
);

alter table public.interesados enable row level security;

-- Cualquier visitante puede ENVIAR su inscripción (pero no leer las de otros).
drop policy if exists "interesados_enviar" on public.interesados;
create policy "interesados_enviar" on public.interesados
  for insert to anon, authenticated
  with check (acepta_datos = true and estado = 'nuevo');

-- Solo los administradores pueden VER, marcar o borrar.
drop policy if exists "interesados_admin_ver" on public.interesados;
create policy "interesados_admin_ver" on public.interesados
  for select to authenticated
  using (exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email')));

drop policy if exists "interesados_admin_editar" on public.interesados;
create policy "interesados_admin_editar" on public.interesados
  for update to authenticated
  using (exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email')));

drop policy if exists "interesados_admin_borrar" on public.interesados;
create policy "interesados_admin_borrar" on public.interesados
  for delete to authenticated
  using (exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email')));
