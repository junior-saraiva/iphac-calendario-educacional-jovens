-- Fix import_run constraints to align with Edge Function payloads
-- 1) Scope: accept both short (BR/UF/MUNICIPIO) and descriptive (nacional/estadual/municipal/facultativo), case-insensitive
ALTER TABLE public.import_run DROP CONSTRAINT IF EXISTS import_run_scope_check;
ALTER TABLE public.import_run
  ADD CONSTRAINT import_run_scope_check
  CHECK (
    upper(scope) IN (
      'BR','UF','MUNICIPIO',
      'NACIONAL','ESTADUAL','MUNICIPAL','FACULTATIVO'
    )
  );

-- 2) Status: include completed_with_warnings, case-insensitive
ALTER TABLE public.import_run DROP CONSTRAINT IF EXISTS import_run_status_check;
ALTER TABLE public.import_run
  ADD CONSTRAINT import_run_status_check
  CHECK (
    lower(status) IN (
      'pending','running','completed','failed','completed_with_warnings'
    )
  );