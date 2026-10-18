-- CCN · Nuevo número oficial de WhatsApp: +51 944 485 759
-- Pégalo UNA vez en Supabase > SQL Editor > Run.
insert into public.ajustes (clave, valor) values ('whatsapp', '51944485759')
  on conflict (clave) do update set valor = excluded.valor;
select clave, valor from public.ajustes where clave = 'whatsapp';
