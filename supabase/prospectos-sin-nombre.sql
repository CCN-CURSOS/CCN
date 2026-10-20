-- 20 oct: el nombre del prospecto es OPCIONAL (no todos lo dan). Basta el celular.
alter table public.prospectos drop constraint if exists prospectos_nombres_check;
alter table public.prospectos add constraint prospectos_nombres_check check (char_length(nombres) <= 120);
alter table public.prospectos alter column nombres set default '';
