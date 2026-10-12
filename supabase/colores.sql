-- COLORES POR PROGRAMA: agrega Grafito (g12), Ámbar (g13) y Terracota (g14)
-- y asigna a cada curso el color de su programa. Seguro de repetir.

alter table public.cursos drop constraint if exists cursos_color_check;
alter table public.cursos add constraint cursos_color_check check (color ~ '^g([1-9]|1[0-4])$');

update public.cursos set color = 'g12' where titulo = 'Notion desde 0';
update public.cursos set color = 'g1'  where titulo ilike 'IA aplicada%';
update public.cursos set color = 'g14' where titulo = 'Claude para principiantes';
update public.cursos set color = 'g2'  where titulo = 'Word';
update public.cursos set color = 'g10' where titulo = 'Excel';
update public.cursos set color = 'g9'  where titulo = 'PowerPoint';
update public.cursos set color = 'g11' where titulo = 'Club Ofimática';
update public.cursos set color = 'g4'  where titulo ilike 'Crea y publica%';
update public.cursos set color = 'g13' where titulo = 'Illustrator desde 0';
update public.cursos set color = 'g8'  where titulo = 'Photoshop desde 0';
update public.cursos set color = 'g4'  where titulo = 'Canva';
