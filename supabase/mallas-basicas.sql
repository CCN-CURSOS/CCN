-- MALLAS BÁSICAS: lo que muestra la web de cada curso (solo títulos cortos, sin el detalle de cada sesión).
-- El detalle completo queda en el documento "Temarios y evaluaciones CCN" (uso interno y de los profesores).
-- Seguro de repetir. No cambia precios, horas, sesiones ni si el curso está visible.

update public.cursos set temario = array[
  'Entorno de Word y tu primer documento','Formato profesional','Imágenes, tablas y diseño de página',
  'Documentos largos','Documentos que se repiten','Proyecto final y presentación'] where titulo = 'Word';

update public.cursos set temario = array[
  'Entorno de Excel y formatos','Fórmulas y funciones básicas','Funciones de uso diario',
  'Ordenar, filtrar y validar datos','Gráficos y tablas dinámicas','Proyecto final y presentación'] where titulo = 'Excel';

update public.cursos set temario = array[
  'Entorno de PowerPoint y tu primera presentación','Diseño que se entiende','Imágenes, íconos y formas',
  'Tablas, gráficos y esquemas','Transiciones y animaciones','Presentar con seguridad y proyecto final'] where titulo = 'PowerPoint';

update public.cursos set temario = array[
  'WORD · Entorno y primer documento','WORD · Formato profesional','WORD · Imágenes, tablas y diseño',
  'WORD · Documentos largos','WORD · Documentos que se repiten','WORD · Proyecto final',
  'EXCEL · Entorno y formatos','EXCEL · Fórmulas y funciones básicas','EXCEL · Funciones de uso diario',
  'EXCEL · Ordenar, filtrar y validar datos','EXCEL · Gráficos y tablas dinámicas','EXCEL · Proyecto final',
  'POWERPOINT · Entorno y primera presentación','POWERPOINT · Diseño que se entiende','POWERPOINT · Imágenes, íconos y formas',
  'POWERPOINT · Tablas, gráficos y esquemas','POWERPOINT · Transiciones y animaciones','POWERPOINT · Presentar y proyecto final'] where titulo = 'Club Ofimática';

update public.cursos set temario = array[
  'Primeros pasos en Notion','Bloques y formato','Bases de datos I','Bases de datos II',
  'Conectar información','Organizar tu negocio o tus estudios','Panel de control y trabajo en equipo','Proyecto final y presentación'] where titulo = 'Notion desde 0';

update public.cursos set temario = array[
  'Entorno de Illustrator','Formas y selección','Herramienta Pluma','Color y degradados',
  'Texto y tipografía','Capas, máscaras y efectos','Calco y logotipos','Proyecto final y exportación'] where titulo = 'Illustrator desde 0';

update public.cursos set temario = array[
  'Entorno de Photoshop','Capas','Selecciones y máscaras','Retoque y color',
  'Texto, formas y estilos','Fotomontaje','Diseño para redes','Proyecto final y presentación'] where titulo = 'Photoshop desde 0';

update public.cursos set temario = array[
  'Conociendo a Claude','Cómo pedir bien','Redactar y mejorar textos','Analizar documentos y datos',
  'Proyectos y tareas repetitivas','Proyecto final'] where titulo = 'Claude para principiantes';

update public.cursos set temario = array[
  'Primeros pasos en Canva','Diseño básico','Publicaciones e historias','Kit de marca y piezas para imprimir',
  'Presentaciones y videos cortos','Proyecto final: pack de marca'] where titulo = 'Canva';

update public.cursos set temario = array[
  'La IA en los negocios','Pedir bien a la IA','Ventas y atención al cliente','Marketing y contenido',
  'Documentos y análisis','Procesos y tareas repetitivas','Tu plan de IA para el negocio','Taller del proyecto final','Presentación del proyecto final'] where titulo ilike 'IA aplicada%';

update public.cursos set temario = array[
  'Cómo funciona la web','HTML','CSS I','CSS II','Diseño responsive','JavaScript básico','Publicar tu página','Proyecto final y presentación'] where titulo ilike 'Crea y publica%';

select titulo, horas, sesiones, array_length(temario,1) as temas from public.cursos order by orden;
