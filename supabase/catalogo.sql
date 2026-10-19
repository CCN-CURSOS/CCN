-- ===================================================================================
-- CATÁLOGO NUEVO (12 oct 2026) · seguro de repetir: no duplica ni borra nada
--   1) Permite 11 colores (cada curso con su propio degradado)
--   2) Oculta los cursos viejos (Meta Ads, Tienda online) sin borrarlos
--   3) Renombra "Notion para tu negocio" -> "Notion desde 0"
--   4) Crea los cursos nuevos OCULTOS: actívalos en Web -> Cursos cuando tengan
--      horas, temario y portada (Visible = sí)
-- ===================================================================================
alter table public.cursos drop constraint if exists cursos_color_check;
alter table public.cursos add constraint cursos_color_check check (color ~ '^g([1-9]|1[0-4])$');

-- 2) cursos viejos: ocultos (los grupos e inscritos que tengan se conservan)
update public.cursos set activo = false, destacado = false
 where titulo ilike 'Meta Ads%' or titulo ilike 'Tienda online%';

-- 3) Notion
update public.cursos
   set titulo = 'Notion desde 0',
       descripcion = 'Aprende Notion desde cero y arma tu propio espacio para organizar tareas, clientes y proyectos.',
       color = 'g5'
 where titulo ilike 'Notion para%';

-- 4) cursos nuevos (solo si todavía no existen)
insert into public.cursos (titulo, descripcion, color, horas, sesiones, precio, programas, temario, extra, orden, activo, destacado)
select v.titulo, v.descripcion, v.color, v.horas, v.sesiones, v.precio, v.programas, '{}', '', v.orden, false, false
from (values
  ('Notion desde 0',            'Aprende Notion desde cero y arma tu propio espacio para organizar tareas, clientes y proyectos.', 'g5', 12, 4, 299, 'Notion (plan gratuito)', 1),
  ('Claude para principiantes', 'Aprende a usar Claude desde cero y a armar procesos para tu día a día y tu negocio.',            'g3', 12, 4, 299, 'Claude', 3),
  ('Word',                      'Domina Word desde cero: documentos, formatos y trabajos con presentación profesional.',          'g2', 12, 4, 200, 'Microsoft Word', 4),
  ('Excel',                     'Aprende Excel desde cero: tablas, fórmulas y reportes para tu trabajo o tu negocio.',            'g7', 12, 4, 200, 'Microsoft Excel', 5),
  ('PowerPoint',                'Crea presentaciones claras y profesionales en PowerPoint.',                                       'g9', 12, 4, 200, 'Microsoft PowerPoint', 6),
  ('Club Ofimática',            'Word, Excel y PowerPoint en un solo paquete: 42 horas para dominar la ofimática.',               'g11', 42, 18, 459, 'Microsoft Word, Excel y PowerPoint', 7),
  ('Illustrator desde 0',       'Aprende diseño vectorial desde cero con Adobe Illustrator.',                                      'g6', 12, 4, 299, 'Adobe Illustrator', 9),
  ('Photoshop desde 0',         'Aprende edición y diseño de imágenes desde cero con Adobe Photoshop.',                            'g8', 12, 4, 299, 'Adobe Photoshop', 10),
  ('Canva',                     'Diseña piezas para redes y tu negocio con Canva, paso a paso.',                                   'g10', 12, 4, 299, 'Canva', 11)
) as v(titulo, descripcion, color, horas, sesiones, precio, programas, orden)
where not exists (select 1 from public.cursos c where lower(c.titulo) = lower(v.titulo));

-- orden y colores de los que ya existían
update public.cursos set orden = 2, color = 'g1' where titulo ilike 'IA aplicada%';
update public.cursos set orden = 8, color = 'g4' where titulo ilike 'Crea y publica%';
update public.cursos set orden = 1 where titulo = 'Notion desde 0';
