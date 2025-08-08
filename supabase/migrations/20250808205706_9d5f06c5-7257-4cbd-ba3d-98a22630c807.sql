-- Option A: cache table + view + RLS for public read
-- Safe extension for UUIDs
create extension if not exists pgcrypto with schema public;

-- Cache table for external VIEW data
create table if not exists public.alunos_view_cache (
  id uuid primary key default gen_random_uuid(),
  ra text not null,
  cpf text,
  nome text not null,
  dtinicio date,
  dtfim date,
  cidade text,
  resfinanceiro text,
  curso text,
  codturma text,
  disciplina text,
  ch integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update timestamp trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_alunos_view_cache on public.alunos_view_cache;
create trigger trg_set_updated_at_alunos_view_cache
before update on public.alunos_view_cache
for each row execute function public.set_updated_at();

-- Uniqueness to avoid duplicates for same RA/Disciplina/CH
create unique index if not exists alunos_view_cache_unique_idx
  on public.alunos_view_cache (ra, coalesce(disciplina,''), coalesce(ch,0));

-- Helpful read indexes
create index if not exists alunos_view_cache_ra_idx on public.alunos_view_cache (ra);
create index if not exists alunos_view_cache_cpf_idx on public.alunos_view_cache (cpf);

-- Exposed VIEW with required uppercase aliases
drop view if exists public."VW_DADOS_ALUNOS_DISCIPLINAS_ATIVOS";
create view public."VW_DADOS_ALUNOS_DISCIPLINAS_ATIVOS" as
select
  ra as "RA",
  cpf as "CPF",
  nome as "NOME",
  dtinicio as "DTINICIO",
  dtfim as "DTFIM",
  cidade as "CIDADE",
  resfinanceiro as "RESFINCEIRO",
  curso as "CURSO",
  codturma as "CODTURMA",
  disciplina as "DISCIPLINA",
  ch as "CH"
from public.alunos_view_cache;

-- RLS for underlying table
alter table public.alunos_view_cache enable row level security;

-- Allow read access (SELECT) to anon & authenticated roles
drop policy if exists "allow select cache to anon" on public.alunos_view_cache;
create policy "allow select cache to anon"
on public.alunos_view_cache
for select
to anon, authenticated
using (true);

-- Ensure roles can SELECT from the VIEW
grant select on public."VW_DADOS_ALUNOS_DISCIPLINAS_ATIVOS" to anon, authenticated;