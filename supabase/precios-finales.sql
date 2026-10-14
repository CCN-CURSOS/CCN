-- PRECIOS FINALES (14 oct): el precio ya INCLUYE IGV. El sistema no suma nada.
-- precio_antes (tachado): 60 % de descuento en los más baratos, 50 % en los intermedios, 40 % en los más caros.
update public.cursos set precio = 229, precio_antes = 573 where titulo in ('Notion desde 0', 'Word', 'Excel', 'PowerPoint', 'Claude para principiantes', 'Canva');
update public.cursos set precio = 259, precio_antes = 518 where titulo in ('Illustrator desde 0', 'Photoshop desde 0');
update public.cursos set precio = 459, precio_antes = 918 where titulo = 'Club Ofimática';
update public.cursos set precio = 359, precio_antes = 598 where titulo ilike 'IA aplicada%' or titulo ilike 'Crea y publica%';

select titulo, precio, precio_antes, round((1 - precio::numeric / precio_antes) * 100) as dscto_pct from public.cursos order by orden;
