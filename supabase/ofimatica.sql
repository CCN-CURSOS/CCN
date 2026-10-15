-- OFIMÁTICA: 14 h por sub-curso (6 sesiones: 5 de 2,5 h + 1 de 1,5 h) y Club = 42 h (18 sesiones)
-- Seguro de repetir. Deja los cursos OCULTOS: actívalos en Web -> Cursos cuando tengan portada.

update public.cursos set horas = 14, sesiones = 6, programas = 'Microsoft Word',
  descripcion = 'Domina Word desde cero: documentos, formatos y trabajos con presentación profesional. Terminas con un documento propio listo para usar.',
  temario = array[
    'Entorno de Word y tu primer documento',
    'Formato profesional: estilos, párrafos, listas y tabulaciones',
    'Imágenes, tablas y diseño de página',
    'Documentos largos: tabla de contenido, citas y referencias',
    'Documentos que se repiten: plantillas, combinar correspondencia y revisión',
    'Proyecto final y presentación'],
  extra = 'plantillas listas para tu trabajo: currículum, carta, informe y cotización'
where titulo = 'Word';

update public.cursos set horas = 14, sesiones = 6, programas = 'Microsoft Excel',
  descripcion = 'Aprende Excel desde cero: tablas, fórmulas y reportes para tu trabajo, tus estudios o tu día a día. Terminas con un archivo propio que se calcula solo.',
  temario = array[
    'Entorno de Excel, celdas y formatos',
    'Fórmulas y funciones básicas',
    'Funciones de uso diario: SI, BUSCARV, SUMAR.SI y fechas',
    'Ordenar, filtrar y validar datos; formato condicional',
    'Gráficos y tablas dinámicas',
    'Proyecto final y presentación'],
  extra = 'plantillas de control de ventas, gastos e inventario'
where titulo = 'Excel';

update public.cursos set horas = 14, sesiones = 6, programas = 'Microsoft PowerPoint',
  descripcion = 'Crea presentaciones claras y profesionales en PowerPoint. Terminas con una presentación propia lista para exponer.',
  temario = array[
    'Entorno de PowerPoint y tu primera presentación',
    'Diseño que se entiende: color, tipografía y patrón de diapositivas',
    'Imágenes, íconos, formas y SmartArt',
    'Tablas, gráficos y esquemas',
    'Transiciones, animaciones, audio, video y enlaces',
    'Presentar con seguridad y proyecto final'],
  extra = 'plantillas de presentación para tu trabajo o tus estudios'
where titulo = 'PowerPoint';

update public.cursos set horas = 42, sesiones = 18, programas = 'Microsoft Word, Excel y PowerPoint',
  descripcion = 'Word, Excel y PowerPoint en un solo paquete: 42 horas para dominar la ofimática, con el mismo temario de cada curso.',
  temario = array[
    'WORD · Entorno de Word y tu primer documento',
    'WORD · Formato profesional: estilos, párrafos, listas y tabulaciones',
    'WORD · Imágenes, tablas y diseño de página',
    'WORD · Documentos largos: tabla de contenido, citas y referencias',
    'WORD · Documentos que se repiten: plantillas, combinar correspondencia y revisión',
    'WORD · Proyecto final y presentación',
    'EXCEL · Entorno de Excel, celdas y formatos',
    'EXCEL · Fórmulas y funciones básicas',
    'EXCEL · Funciones de uso diario: SI, BUSCARV, SUMAR.SI y fechas',
    'EXCEL · Ordenar, filtrar y validar datos; formato condicional',
    'EXCEL · Gráficos y tablas dinámicas',
    'EXCEL · Proyecto final y presentación',
    'POWERPOINT · Entorno de PowerPoint y tu primera presentación',
    'POWERPOINT · Diseño que se entiende: color, tipografía y patrón de diapositivas',
    'POWERPOINT · Imágenes, íconos, formas y SmartArt',
    'POWERPOINT · Tablas, gráficos y esquemas',
    'POWERPOINT · Transiciones, animaciones, audio, video y enlaces',
    'POWERPOINT · Presentar con seguridad y proyecto final'],
  extra = 'plantillas para tu trabajo o tus estudios en los tres programas'
where titulo = 'Club Ofimática';
