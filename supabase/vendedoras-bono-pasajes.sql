-- BONO DE PASAJES DE LAS VENDEDORAS + SUELDO S/450 + MÍNIMO 5 CUPOS ----------------------------
-- Se puede pegar más de una vez. Pégalo ANTES de subir el código nuevo.

-- 1) Bono de pasajes (nuevo campo en la ficha del trabajador)
alter table public.trabajadores add column if not exists bono_pasajes numeric not null default 0 check (bono_pasajes >= 0);

-- 2) Las vendedoras que tenían sueldo S/600 pasan a sueldo S/450 + bono S/150 (total sigue en S/600)
update public.trabajadores set sueldo_base = 450, bono_pasajes = 150
 where puesto = 'vendedor' and sueldo_base = 600 and bono_pasajes = 0;

-- 3) Mínimo para abrir un curso: 5 (los grupos que tenían 10 pasan a 5)
alter table public.grupos alter column minimo set default 5;
update public.grupos set minimo = 5 where minimo = 10;
