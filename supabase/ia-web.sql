-- IA aplicada a negocios: 18 h, 9 sesiones de 2 h
-- Crea y publica tu primera página web: 24 h, 8 sesiones de 3 h
-- Seguro de repetir. No cambia si están visibles u ocultos.

update public.cursos set horas = 18, sesiones = 9,
  descripcion = 'Aprende a usar la inteligencia artificial para vender más, atender mejor y ahorrar tiempo en tu negocio, con procesos que puedes aplicar desde la primera semana.',
  temario = array[
    'La IA en los negocios: qué puede y qué no puede hacer, y por dónde empezar',
    'Pedir bien a la IA: instrucciones, contexto y ejemplos que dan resultados',
    'Ventas y atención al cliente: respuestas, guiones y seguimiento de prospectos',
    'Marketing y contenido: ideas, textos, calendario de publicaciones e imágenes',
    'Documentos y análisis: propuestas, resúmenes, informes y datos de tu negocio',
    'Procesos y tareas repetitivas: armar flujos de trabajo con IA',
    'Tu plan de IA para el negocio: herramientas, costos, privacidad y buenas prácticas',
    'Taller del proyecto final: trabajo guiado sobre tu propio negocio',
    'Presentación del proyecto final']
where titulo ilike 'IA aplicada%';

update public.cursos set horas = 24, sesiones = 8,
  descripcion = 'Aprende desde cero a crear tu propia página web y a publicarla en internet, escribiendo tú mismo cada parte.',
  programas = 'Editor de código, navegador, GitHub y hosting gratuito',
  temario = array[
    'Cómo funciona la web: navegador, editor de código, carpetas y primera página en HTML',
    'HTML: textos, enlaces, imágenes, listas, tablas y formularios',
    'CSS I: selectores, colores, tipografía y modelo de caja',
    'CSS II: Flexbox y Grid para organizar secciones',
    'Diseño responsive: que tu página se vea bien en celular y computadora',
    'JavaScript básico: variables, eventos y menú interactivo',
    'Publicar tu página: GitHub, hosting gratuito y dominio',
    'Proyecto final y presentación']
where titulo ilike 'Crea y publica%';
