-- 1) Indexes on public.feriado
-- Keep existing unique constraints intact; just add helpful indexes
CREATE INDEX IF NOT EXISTS idx_feriado_ano ON public.feriado (ano);
CREATE INDEX IF NOT EXISTS idx_feriado_uf_ibge_code ON public.feriado (uf, ibge_code);

-- 2) import_run table for import job logs
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

-- Enable RLS for security
ALTER TABLE public.import_run ENABLE ROW LEVEL SECURITY;

-- Only admins (via has_role) can access/modify logs, mirroring existing patterns
CREATE POLICY "admin can select import_run"
ON public.import_run
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admin can insert import_run"
ON public.import_run
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "admin can update import_run"
ON public.import_run
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "admin can delete import_run"
ON public.import_run
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger to auto-update updated_at on UPDATEs
DROP TRIGGER IF EXISTS set_timestamp_import_run ON public.import_run;
CREATE TRIGGER set_timestamp_import_run
BEFORE UPDATE ON public.import_run
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();