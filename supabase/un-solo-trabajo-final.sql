-- 18 oct: se elimina el T1. Cada curso tiene UN solo trabajo final (en el Club, uno por programa: Word, Excel y PowerPoint).
-- Se desactiva el T1 (no se borra: queda el historial). El T2 pasa a mostrarse como "Trabajo final".
update public.entregables set activo = false where etapa = 'T1';
select c.titulo, e.programa, e.titulo as trabajo_final
from public.entregables e join public.cursos c on c.id::text = e.curso_id::text
where e.activo order by c.titulo, e.orden;
