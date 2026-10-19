# Archivos SQL de CCN

Regla: cada archivo se pega UNA vez en Supabase > SQL Editor (el contenido, no el nombre). Los marcados "seguro de repetir" se pueden volver a pegar.

**NO vuelvas a pegar** `schema.sql`, `crm.sql` ni `catalogo.sql` en una base que ya tiene datos.

## Base (ya aplicados)
schema.sql · crm.sql · profesores.sql · certificados.sql · entregables.sql · interesados.sql · interesados-carrito.sql · consultas.sql · descuentos.sql · vendedoras-bono-pasajes.sql · asistencia-2-estados.sql · grupos-lanzamiento.sql · colores.sql · bienvenida.sql · prospectos-tipo.sql · monedas-descuentos.sql

## Contenido de cursos (HISTORIAL: no repetir)
Estos archivos reescriben `cursos.temario`, textos y precios. Si se vuelven a pegar en desorden, **revierten** lo último. Orden en que se aplicaron:
catalogo → ofimatica → desde0 → claude-canva → ia-web → textos-generales → mallas-basicas → precios-finales → precios-usd → curso-web-simple → temarios-christofer → un-solo-trabajo-final

## Ajustes puntuales
whatsapp-nuevo.sql (WhatsApp +51 944 485 759) · un-solo-trabajo-final.sql (desactiva el T1)

## Pruebas
prueba-bienvenida.sql crea/borra un alumno de prueba (DNI 99999901). No se sube al repositorio de producción.

## Redundante
`precio_antes.sql` ya está dentro de `schema.sql`; se puede borrar.

## Edge Functions
`functions/enviar-bienvenida` y `functions/enviar-certificado` (Resend). Se despliegan desde el panel de Supabase.
