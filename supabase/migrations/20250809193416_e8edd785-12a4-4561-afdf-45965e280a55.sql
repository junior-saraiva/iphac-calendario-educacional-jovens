-- Safely add indexes only if table public.feriado exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'feriado'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_feriado_ano ON public.feriado (ano)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_feriado_uf_ibge_code ON public.feriado (uf, ibge_code)';
  ELSE
    RAISE NOTICE 'Table public.feriado not found; skipping index creation';
  END IF;
END
$$;

-- Create import_run table for import job logs
CREATE TABLE IF NOT EXISTS public.import_run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  years integer[],
  scope text,
  uf text,
  ibge_code text,
  metrics jsonb,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb
);

-- Enable RLS and restrict to admins via has_role
ALTER TABLE public.import_run ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "admin can select import_run"
ON public.import_run
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "admin can insert import_run"
ON public.import_run
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "admin can update import_run"
ON public.import_run
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "admin can delete import_run"
ON public.import_run
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS set_timestamp_import_run ON public.import_run;
CREATE TRIGGER set_timestamp_import_run
BEFORE UPDATE ON public.import_run
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();