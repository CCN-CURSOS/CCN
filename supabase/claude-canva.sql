-- Claude para principiantes y Canva: 14 h, 6 sesiones (5 de 2,5 h + 1 de 1,5 h)
-- Seguro de repetir. No cambia si están visibles u ocultos.

update public.cursos set horas = 14, sesiones = 6,
  descripcion = 'Aprende a usar Claude como tu asistente de trabajo y estudio: pedir bien, analizar documentos, redactar y automatizar tareas del día a día.',
  programas = 'Claude (plan gratuito)',
  temario = array[
    'Conociendo a Claude: cuenta, interfaz, conversaciones y límites',
    'Cómo pedir bien: instrucciones claras, contexto, ejemplos y formato de respuesta',
    'Redactar y mejorar textos: correos, mensajes, publicaciones y resúmenes',
    'Analizar documentos y datos: PDF, Excel, imágenes y tablas',
    'Proyectos y tareas repetitivas: instrucciones guardadas y flujos de trabajo',
    'Proyecto final aplicado a tu negocio o tus estudios'],
  extra = 'biblioteca de instrucciones listas para copiar y usar'
where titulo = 'Claude para principiantes';

update public.cursos set horas = 14, sesiones = 6,
  descripcion = 'Aprende Canva desde cero y crea publicaciones, presentaciones y material de marca para tu negocio sin ser diseñador.',
  programas = 'Canva (plan gratuito)',
  temario = array[
    'Primeros pasos en Canva: cuenta, interfaz, plantillas y formatos',
    'Diseño básico: texto, color, tipografía, alineación y jerarquía',
    'Publicaciones y historias para redes sociales',
    'Kit de marca: logo, colores y fuentes; flyers y piezas para imprimir',
    'Presentaciones, videos cortos y animaciones',
    'Proyecto final: tu pack de marca listo para publicar'],
  extra = 'plantillas editables para tus redes sociales'
where titulo = 'Canva';
