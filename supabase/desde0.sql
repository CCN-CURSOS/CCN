-- CURSOS "DESDE 0": 16 h, 8 sesiones de 2 h (Notion, Illustrator, Photoshop)
-- Seguro de repetir. Quedan como estén de visibles: actívalos en Web -> Cursos cuando tengan portada.

update public.cursos set horas = 16, sesiones = 8,
  descripcion = 'Aprende Notion desde cero y arma tu propio espacio para organizar tareas, clientes y proyectos. Terminas usando tu sistema con datos reales.',
  programas = 'Notion (plan gratuito)',
  temario = array[
    'Primeros pasos: cuenta, interfaz, páginas y bloques',
    'Bloques y formato: texto, listas, tareas, columnas, imágenes y contenido incrustado',
    'Bases de datos I: propiedades y vistas (tabla, tablero, calendario y galería)',
    'Bases de datos II: filtros, orden, agrupación y plantillas',
    'Conectar información: relaciones, rollups y fórmulas básicas',
    'Organizar tu negocio o tus estudios: tareas, proyectos, clientes y finanzas',
    'Panel de control y trabajo en equipo: compartir, permisos y comentarios',
    'Proyecto final y presentación'],
  extra = 'plantillas listas y una revisión semanal para decidir qué hacer cada lunes'
where titulo = 'Notion desde 0';

update public.cursos set horas = 16, sesiones = 8,
  descripcion = 'Aprende diseño vectorial desde cero con Adobe Illustrator. Terminas con un logotipo y piezas propias listas para usar.',
  programas = 'Adobe Illustrator',
  temario = array[
    'Entorno de Illustrator: mesas de trabajo, paneles y vectores vs. imágenes',
    'Formas y selección: alinear, transformar y Pathfinder',
    'Herramienta Pluma y trazados: curvas y puntos de ancla',
    'Color: relleno, trazo, degradados y paletas',
    'Texto y tipografía',
    'Capas, máscaras de recorte y efectos',
    'Calco de imágenes y construcción de logotipos',
    'Proyecto final y exportación (PNG, SVG y PDF)'],
  extra = 'guía para presentar y entregar un logotipo a un cliente'
where titulo = 'Illustrator desde 0';

update public.cursos set horas = 16, sesiones = 8,
  descripcion = 'Aprende edición y diseño de imágenes desde cero con Adobe Photoshop. Terminas con retoques y piezas para redes hechas por ti.',
  programas = 'Adobe Photoshop',
  temario = array[
    'Entorno de Photoshop: interfaz, documentos, resolución y formatos',
    'Capas: orden, opacidad y modos de fusión',
    'Selecciones y máscaras de capa',
    'Retoque y color: recorte, niveles, curvas y herramientas de corrección',
    'Texto, formas y estilos de capa',
    'Fotomontaje: combinar imágenes, objetos inteligentes y transformaciones',
    'Diseño para redes: publicaciones, banners y exportación para web',
    'Proyecto final y presentación'],
  extra = 'plantillas editables de publicaciones para redes sociales'
where titulo = 'Photoshop desde 0';
