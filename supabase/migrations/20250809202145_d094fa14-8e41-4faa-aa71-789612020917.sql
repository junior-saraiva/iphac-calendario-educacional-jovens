-- 1) Tabela de feriados com RLS, índices e gatilho updated_at
create table if not exists public.feriado (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  nome text,
  descricao text,
  -- alcance do feriado
  tipo text not null check (tipo in ('nacional','estadual','municipal','facultativo')),
  uf text,
  ibge_code text,
  -- coluna gerada para facilitar filtros/índices
  ano integer generated always as (extract(year from data)::int) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habilita RLS
alter table public.feriado enable row level security;

-- Políticas (somente admins)
drop policy if exists "feriado admins all" on public.feriado;
create policy "feriado admins all"
  on public.feriado
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Índices exigidos pelo checklist
create index if not exists feriado_ano_idx on public.feriado (ano);
create index if not exists feriado_alcance_idx on public.feriado (tipo, uf, ibge_code);
create unique index if not exists feriado_unique_idx on public.feriado (data, uf, ibge_code, tipo) nulls not distinct;

-- Gatilho de atualização de updated_at
drop trigger if exists set_feriado_updated_at on public.feriado;
create trigger set_feriado_updated_at
  before update on public.feriado
  for each row execute function public.set_updated_at();


-- 2) Tabela de execução de importações (import_run)
create table if not exists public.import_run (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid, -- opcional: quem disparou
  years integer[] not null,
  scope text not null check (scope in ('BR','UF','MUNICIPIO')),
  uf text,
  ibge_code text,
  status text not null check (status in ('pending','running','completed','failed')) default 'pending',
  metrics jsonb default '{}'::jsonb,
  payload jsonb
);

alter table public.import_run enable row level security;

drop policy if exists "import_run admins all" on public.import_run;
create policy "import_run admins all"
  on public.import_run
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Gatilho updated_at
drop trigger if exists set_import_run_updated_at on public.import_run;
create trigger set_import_run_updated_at
  before update on public.import_run
  for each row execute function public.set_updated_at();
