-- CURSO WEB simplificado (18 oct): 24 h · 8 sesiones. Sin Supabase. Todo lo más simple posible.
-- Herramientas: Visual Studio Code, navegador (Chrome recomendado), GitHub (subiendo archivos desde el navegador) y Vercel.
-- Seguro de repetir. No cambia precios ni visibilidad.
update public.cursos set horas = 24, sesiones = 8,
  descripcion = 'Aprende desde cero, paso a paso y sin conocimientos previos, a crear tu primera página web y a publicarla en internet.',
  programas = 'Visual Studio Code, navegador, GitHub y Vercel',
  temario = array[
    'Cómo funciona la web: navegador, Visual Studio Code, carpetas y tu primera página en HTML',
    'HTML: textos, enlaces, imágenes, listas y formularios',
    'CSS I: colores, tipografía y modelo de caja',
    'CSS II: Flexbox para organizar secciones',
    'Diseño responsive: que tu página se vea bien en celular y computadora',
    'JavaScript básico: un menú o botón interactivo',
    'Publicar tu página: cuenta de GitHub, subir tus archivos y Vercel',
    'Proyecto final y presentación']
where titulo ilike 'Crea y publica%';

update public.cursos set temario = array[
  'Cómo funciona la web','HTML','CSS I','CSS II','Diseño responsive','JavaScript básico','Publicar tu página','Proyecto final y presentación']
where titulo ilike 'Crea y publica%';

select titulo, horas, sesiones, array_length(temario,1) as temas from public.cursos where titulo ilike 'Crea y publica%';
