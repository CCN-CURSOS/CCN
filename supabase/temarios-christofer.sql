-- Aportes de Christofer a Illustrator y Photoshop (18 oct). Se mantiene el formato CCN: 16 h, 8 sesiones de 2 h.
-- La web muestra la malla básica (títulos cortos). El detalle va en el doc y en el PDF.
update public.cursos set temario = array[
  'Bases del diseño y entorno de Illustrator','Formas y selección','Herramienta Pluma','Color y degradados',
  'Texto y tipografía','Capas, máscaras y efectos','Calco y logotipos','Proyecto final, diagramación y exportación'] where titulo = 'Illustrator desde 0';

update public.cursos set temario = array[
  'Entorno, resolución y color','Capas','Selecciones y máscaras','Retoque y color',
  'Texto, formas y estilos','Fotomontaje','Diseño para redes','Proyecto final, diagramación y exportación'] where titulo = 'Photoshop desde 0';
