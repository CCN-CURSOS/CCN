-- AUDITORÍA (solo lectura): no cambia nada. Pega cada bloque por separado y mándame captura si algo se ve raro.

-- 1) Cursos: precio, tachado, dólares, horas, sesiones, visibilidad
select titulo, precio, precio_antes, precio_usd, precio_antes_usd, horas, sesiones, activo
from public.cursos order by orden;

-- 2) Enlaces de /links (revisa que no diga "desde S/299")
select titulo, subtitulo, activo from public.enlaces order by orden;

-- 3) Ajustes (WhatsApp debe ser 51944485759; descuento_max_pct = 10)
select * from public.ajustes;

-- 4) Entregables activos (debe haber UNO por curso, tres en el Club)
select c.titulo, e.programa, e.etapa, e.titulo as trabajo
from public.entregables e join public.cursos c on c.id::text = e.curso_id::text
where e.activo order by c.titulo, e.orden;

-- 5) Grupos abiertos
select codigo, estado, inicio, dias, horario, inscritos, minimo from public.grupos where activo order by inicio;

-- 6) Alumno de prueba (debe devolver 0 filas)
select * from public.alumnos where documento = '99999901';

-- 7) Plantillas guardadas que tapan el texto del código
select tipo, actualizado from public.plantillas_doc;
