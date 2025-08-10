
-- 1) Tabela de municípios
CREATE TABLE IF NOT EXISTS public.municipio (
  ibge_code text PRIMARY KEY,
  nome text NOT NULL,
  uf text NOT NULL,
  nome_uf text,
  microrregiao text,
  mesorregiao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Habilitar RLS
ALTER TABLE public.municipio ENABLE ROW LEVEL SECURITY;

-- 3) Políticas de acesso
-- Leitura pública (os dados não são sensíveis e ajudam na UX de seleção/autocomplete)
DROP POLICY IF EXISTS "municipio public read" ON public.municipio;
CREATE POLICY "municipio public read"
  ON public.municipio
  FOR SELECT
  USING (true);

-- Administração completa apenas para admins
DROP POLICY IF EXISTS "municipio admin all" ON public.municipio;
CREATE POLICY "municipio admin all"
  ON public.municipio
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4) Trigger de updated_at
DROP TRIGGER IF EXISTS set_updated_at_municipio ON public.municipio;
CREATE TRIGGER set_updated_at_municipio
BEFORE UPDATE ON public.municipio
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 5) Índices para performance em buscas/filtragens
CREATE INDEX IF NOT EXISTS municipio_uf_idx ON public.municipio (uf);
CREATE INDEX IF NOT EXISTS municipio_nome_idx ON public.municipio (nome);
