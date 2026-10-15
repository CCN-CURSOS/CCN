-- Quita el enfoque solo "negocio" de los textos de los cursos (CCN sirve también para la vida personal y los estudios).
-- Seguro de repetir. No toca precios, horas, visibilidad ni "IA aplicada a negocios" (ese curso sí es de negocios).
update public.cursos set descripcion = 'Aprende Excel desde cero: tablas, fórmulas y reportes para tu trabajo, tus estudios o tu día a día. Terminas con un archivo propio que se calcula solo.' where titulo = 'Excel';
update public.cursos set descripcion = 'Aprende Canva desde cero y crea publicaciones, presentaciones y material de marca para lo que necesites, sin ser diseñador.' where titulo = 'Canva';
update public.cursos set extra = 'plantillas de presentación para tu trabajo o tus estudios' where titulo = 'PowerPoint';
update public.cursos set extra = 'plantillas para tu trabajo o tus estudios en los tres programas' where titulo = 'Club Ofimática';
update public.cursos set temario = array_replace(temario, 'Organizar tu negocio o tus estudios: tareas, proyectos, clientes y finanzas', 'Organizar tus estudios, trabajo y proyectos: tareas, clientes y finanzas') where titulo = 'Notion desde 0';
update public.cursos set temario = array_replace(temario, 'Organizar tu negocio o tus estudios', 'Organizar tus estudios, trabajo y proyectos') where titulo = 'Notion desde 0';
update public.cursos set temario = array_replace(temario, 'Proyecto final aplicado a tu negocio o tus estudios', 'Proyecto final aplicado a tu trabajo o tus estudios') where titulo = 'Claude para principiantes';
select titulo, descripcion, extra from public.cursos where descripcion ilike '%negocio%' or extra ilike '%negocio%' order by orden;
