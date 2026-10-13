-- DESCUENTOS POR HORA DE LAS VENDEDORAS (solo gerencia: la vendedora NO puede leerlos) ----------
-- Ajustes manuales, p. ej. "Día presencial no asistido" = 4 horas. Se puede pegar más de una vez.
create table if not exists public.descuentos_trab (
  id             uuid primary key default gen_random_uuid(),
  creado         timestamptz not null default now(),
  vendedor       text not null,                                   -- correo de la vendedora
  mes            text not null check (mes ~ '^[0-9]{4}-[0-9]{2}$'), -- mes al que se aplica, ej. 2026-11
  fecha          date,                                            -- día del hecho (opcional)
  horas          numeric not null check (horas > 0 and horas <= 200),
  motivo         text not null default '',
  registrado_por text not null default coalesce(auth.jwt() ->> 'email', '')
);
create index if not exists descuentos_trab_idx on public.descuentos_trab (vendedor, mes);
alter table public.descuentos_trab enable row level security;
drop policy if exists "descuentos_trab_gerente" on public.descuentos_trab;
create policy "descuentos_trab_gerente" on public.descuentos_trab for all to authenticated
  using (public.es_gerente()) with check (public.es_gerente());
