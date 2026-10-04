-- CCN · esquema de base de datos (Supabase)
-- Pégalo completo en Supabase > SQL Editor > Run.

-- 1) Quién puede entrar al panel
create table if not exists public.admins (
  email text primary key
);

-- IMPORTANTE: cambia este correo por el tuyo (el mismo con el que crearás tu usuario en Authentication)
insert into public.admins (email) values ('ccn.cursos.pe@gmail.com')
on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

-- 2) Cursos (el catálogo)
create table if not exists public.cursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null default '',
  color text not null default 'g1' check (color in ('g1','g2','g3','g4','g5')),
  horas int not null default 12,
  sesiones int not null default 4,
  precio int not null default 299,
  programas text not null default '',
  temario text[] not null default '{}',
  extra text not null default '',
  orden int not null default 0,
  activo boolean not null default true,
  imagen_url text,
  precio_antes int,
  destacado boolean not null default false,
  creado timestamptz not null default now()
);
alter table public.cursos add column if not exists imagen_url text;
alter table public.cursos add column if not exists precio_antes int;
alter table public.cursos add column if not exists destacado boolean not null default false;

-- 3) Grupos (cada vez que abre un curso: fecha, días y horario)
create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos(id) on delete cascade,
  inicio date,
  dias text not null default '',
  horario text not null default '',
  estado text not null default 'abierto' check (estado in ('abierto','lleno','cerrado')),
  inscritos int not null default 0,
  minimo int not null default 10,
  mostrar_inscritos boolean not null default false,
  activo boolean not null default true,
  creado timestamptz not null default now()
);
create index if not exists grupos_curso_idx on public.grupos(curso_id);

-- 3b) Ajustes sueltos (por ahora: el WhatsApp de CCN)
create table if not exists public.ajustes (
  clave text primary key,
  valor text not null default ''
);
insert into public.ajustes (clave, valor) values ('whatsapp', '51931330058') on conflict do nothing;

-- 4) Seguridad (RLS): cualquiera lee lo publicado, solo admins escriben
alter table public.admins enable row level security;
alter table public.cursos enable row level security;
alter table public.grupos enable row level security;
alter table public.ajustes enable row level security;

drop policy if exists "admins_ver_propio" on public.admins;
create policy "admins_ver_propio" on public.admins for select to authenticated
  using (email = (auth.jwt() ->> 'email'));

drop policy if exists "cursos_publico" on public.cursos;
create policy "cursos_publico" on public.cursos for select using (activo or public.is_admin());
drop policy if exists "cursos_admin_escribe" on public.cursos;
create policy "cursos_admin_escribe" on public.cursos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "grupos_publico" on public.grupos;
create policy "grupos_publico" on public.grupos for select using (activo or public.is_admin());
drop policy if exists "grupos_admin_escribe" on public.grupos;
create policy "grupos_admin_escribe" on public.grupos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ajustes_publico" on public.ajustes;
create policy "ajustes_publico" on public.ajustes for select using (true);
drop policy if exists "ajustes_admin_escribe" on public.ajustes;
create policy "ajustes_admin_escribe" on public.ajustes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 5) Imágenes de los cursos (Storage)
insert into storage.buckets (id, name, public) values ('cursos','cursos',true) on conflict (id) do nothing;
drop policy if exists "img_publico" on storage.objects;
create policy "img_publico" on storage.objects for select using (bucket_id = 'cursos');
drop policy if exists "img_admin_sube" on storage.objects;
create policy "img_admin_sube" on storage.objects for insert to authenticated with check (bucket_id = 'cursos' and public.is_admin());
drop policy if exists "img_admin_cambia" on storage.objects;
create policy "img_admin_cambia" on storage.objects for update to authenticated using (bucket_id = 'cursos' and public.is_admin());
drop policy if exists "img_admin_borra" on storage.objects;
create policy "img_admin_borra" on storage.objects for delete to authenticated using (bucket_id = 'cursos' and public.is_admin());

-- 6) Los 5 cursos iniciales (puedes editarlos luego desde el panel)
insert into public.cursos (titulo, descripcion, color, horas, sesiones, programas, temario, extra, orden, destacado) values
('IA aplicada a negocios','Usa la IA para vender, atender y organizar tu negocio. Terminas con un asistente propio.','g1',12,4,'ChatGPT, Claude, Gemini, Canva, Google Sheets',
  array['Presentación de las herramientas','IA para vender y comunicar','IA para organizar tu negocio','Tu asistente propio','Proyecto y presentación'],
  'automatización, medir el ahorro y privacidad',1,true),
('Crea y publica tu primera página web','Construyes tu página desde cero y la publicas con dominio propio y botón de WhatsApp.','g2',24,8,'VS Code, GitHub, Vercel, Chrome',
  array['Cómo funciona la web','HTML: la estructura','CSS: el estilo','Diseño de una landing que convierte','JavaScript básico','Publicar en internet','Aparecer en Google y medir visitas','Proyecto y presentación'],
  'Git, rendimiento, seguridad y cómo cotizar una web',2,true),
('Meta Ads para vender','Creas, mides y mejoras anuncios en Facebook e Instagram. Terminas con una campaña lista.','g3',16,8,'Meta Business Suite, Administrador de anuncios, Canva',
  array['Presentación de la interfaz','Medición: píxel y eventos','Estrategia y públicos','Creativos que venden','Primera campaña','Optimización y escalado','Presentación de un proyecto'],
  'rentabilidad, plan de pruebas y reporte semanal',3,true),
('Tienda online','Montas tu tienda en internet y la dejas lista para recibir pedidos por WhatsApp.','g4',20,10,'Plataforma por confirmar, Canva, WhatsApp Business','{}','',4,true),
('Notion para tu negocio','Ordenas clientes, tareas y ventas en un solo espacio de trabajo listo para usar.','g5',12,4,'Notion (plan gratuito)','{}','',5,true);

-- 7) Página de enlaces (/links): reemplaza a Linktree
create table if not exists public.enlaces (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  subtitulo text not null default '',
  url text not null default '',
  tipo text not null default 'enlace' check (tipo in ('enlace','whatsapp')),
  destacado boolean not null default false,
  orden int not null default 0,
  activo boolean not null default true,
  clics int not null default 0,
  creado timestamptz not null default now()
);
alter table public.enlaces enable row level security;
drop policy if exists "enlaces_publico" on public.enlaces;
create policy "enlaces_publico" on public.enlaces for select using (activo or public.is_admin());
drop policy if exists "enlaces_admin_escribe" on public.enlaces;
create policy "enlaces_admin_escribe" on public.enlaces for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- contador de clics (lo puede llamar cualquiera, solo suma 1)
create or replace function public.clic_enlace(enlace_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.enlaces set clics = clics + 1 where id = enlace_id and activo;
$$;
grant execute on function public.clic_enlace(uuid) to anon, authenticated;

insert into public.enlaces (titulo, subtitulo, url, tipo, destacado, orden, activo)
select * from (values
 ('VER LOS CURSOS','Online · desde S/299','/cursos','enlace',true,1,true),
 ('ESCRÍBENOS POR WHATSAPP','Inscripciones y consultas','','whatsapp',false,2,true),
 ('INSTAGRAM','Pon aquí tu @usuario','https://instagram.com/','enlace',false,3,false),
 ('TIKTOK','Pon aquí tu @usuario','https://tiktok.com/','enlace',false,4,false)
) v(titulo,subtitulo,url,tipo,destacado,orden,activo)
where not exists (select 1 from public.enlaces);
