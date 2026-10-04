# CCN · Web con panel admin

React + Vite + Supabase, para publicar en Vercel (igual que Tienda Bro).

## Páginas
- `/` Página principal: muestra los cursos marcados "En inicio" (máximo 5) y el botón "Ver todos los cursos".
- `/cursos` Todos los cursos.
- `/admin` Panel para ti, con 3 secciones: **Cursos** (imagen, precio, temario), **Horarios** (grupos) y **Ajustes** (el WhatsApp).

## Probarlo ahora (sin Supabase)
```
npm install
npm run dev
```
Abre `http://localhost:5173/admin`. Sin Supabase funciona en modo demostración: lo que cambies se guarda solo en tu navegador.

## Dejarlo de verdad (10 minutos)
1. Crea un proyecto en Supabase.
2. SQL Editor: pega `supabase/schema.sql` y ejecuta. El correo admin ya viene como `ccn.cursos.pe@gmail.com`: crea tu usuario en Authentication con ese mismo correo. Esto también crea el espacio para las imágenes.
3. Authentication > Users > Add user: crea tu usuario con ese mismo correo y una contraseña.
4. Copia `.env.example` como `.env` y llena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Project Settings > API). El WhatsApp ya viene con el número de Bro (`51931330058`) y luego lo cambias desde Ajustes, sin tocar código.
5. `npm run dev`, entra a `/admin` y prueba.
6. Sube el proyecto a GitHub, impórtalo en Vercel y agrega las mismas variables de entorno.
7. Cuando compres el dominio, conéctalo en Vercel > Settings > Domains.

## Cómo se usa el panel
- **Curso nuevo:** Cursos > "+ Nuevo curso". Arrastra la imagen, escribe título, precio y temario (módulos con flechas para ordenar).
- **Cambiar un precio:** escribe directo en la tarjeta del curso y presiona Enter.
- **Qué sale en la página principal:** usa el botón "★ En inicio" de cada tarjeta. El máximo es 5.
- **Ocultar un curso:** apaga "Visible en la web".
- **Abrir un grupo:** botón "Abrir grupo" en la tarjeta (o pestaña Horarios). Eliges fecha, días y horas. La tarjeta pasa de "Próximamente" a la fecha y la tabla de horarios se llena sola.
- **Cambiar el WhatsApp:** pestaña Ajustes.
- **Lleno / cerrado:** cambia el estado en la pestaña Horarios. Lleno muestra "Lista de espera". Cerrado lo oculta.

## Seguridad
Cualquiera puede leer lo que está visible. Solo los correos de la tabla `admins` pueden escribir o subir imágenes (reglas RLS en `schema.sql`). La clave `anon` es pública por diseño; nunca pongas la `service_role` en el proyecto.

## Pendiente
Dominio y correos (el pie solo muestra el WhatsApp por ahora), enlaces legales (términos, libro de reclamaciones), logo oficial y logos de Fidtail Perú y Bro Engineering.

## Página de enlaces (/links)
Reemplaza a Linktree: `tudominio.com/links`. Se edita en el panel > **Enlaces** (agregar, editar, ordenar con ↑↓, ocultar, borrar, botón destacado y contador de clics). El tipo "WhatsApp de CCN" usa el número de Ajustes. Si ya tenías Supabase creado, vuelve a correr `supabase/schema.sql` (es seguro repetirlo) para crear la tabla `enlaces`. Instagram y TikTok vienen ocultos: edítalos con tu @usuario y actívalos.
