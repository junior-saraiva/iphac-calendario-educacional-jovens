-- Renomear índices existentes (idempotente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_feriado_ano'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_feriado_ano RENAME TO feriado_ano_idx';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_feriado_uf_ibge_code'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_feriado_uf_ibge_code RENAME TO feriado_alcance_idx';
  END IF;
END $$;

-- Garantir unique index para upsert via PostgREST (NULLS NOT DISTINCT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='feriado_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX feriado_unique_idx
      ON public.feriado (data, uf, ibge_code, tipo)
      NULLS NOT DISTINCT;
  END IF;
END $$;