-- 1) Roles & RBAC
-- Create enum for app roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'operador', 'consulta');
  END IF;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
DO $$
BEGIN
  -- Allow users to read their own roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'users can read own roles'
  ) THEN
    CREATE POLICY "users can read own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  -- Only admins can manage roles (insert/update/delete) via has_role; initially no admin exists, roles must be seeded by DBA
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'admins manage roles'
  ) THEN
    CREATE POLICY "admins manage roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- has_role helper function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

-- 2) Harden alunos_view_cache RLS (remove anon, restrict to roles)
-- Drop overly permissive anon select policy if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alunos_view_cache' AND policyname='allow select cache to anon'
  ) THEN
    DROP POLICY "allow select cache to anon" ON public.alunos_view_cache;
  END IF;
END $$;

ALTER TABLE public.alunos_view_cache ENABLE ROW LEVEL SECURITY;

-- Create select policy for admins and operadores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alunos_view_cache' AND policyname='select admins or operadores'
  ) THEN
    CREATE POLICY "select admins or operadores"
    ON public.alunos_view_cache
    FOR SELECT
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador')
    );
  END IF;
END $$;

-- 3) Tighten alunos_raw_import_json RLS to admin-only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alunos_raw_import_json' AND policyname='allow select json import anon'
  ) THEN
    DROP POLICY "allow select json import anon" ON public.alunos_raw_import_json;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alunos_raw_import_json' AND policyname='allow insert json import anon'
  ) THEN
    DROP POLICY "allow insert json import anon" ON public.alunos_raw_import_json;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alunos_raw_import_json' AND policyname='allow delete json import anon'
  ) THEN
    DROP POLICY "allow delete json import anon" ON public.alunos_raw_import_json;
  END IF;
END $$;

ALTER TABLE public.alunos_raw_import_json ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alunos_raw_import_json' AND policyname='admin can select json import'
  ) THEN
    CREATE POLICY "admin can select json import"
    ON public.alunos_raw_import_json
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alunos_raw_import_json' AND policyname='admin can insert json import'
  ) THEN
    CREATE POLICY "admin can insert json import"
    ON public.alunos_raw_import_json
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alunos_raw_import_json' AND policyname='admin can delete json import'
  ) THEN
    CREATE POLICY "admin can delete json import"
    ON public.alunos_raw_import_json
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 4) Guard helper functions with search_path
CREATE OR REPLACE FUNCTION public.parse_date_safe(_s text)
 RETURNS date
 LANGUAGE plpgsql
 STABLE
 SET search_path = public
AS $function$
DECLARE
  v date;
BEGIN
  IF _s IS NULL OR btrim(_s) = '' THEN
    RETURN NULL;
  END IF;
  BEGIN
    v := to_date(_s, 'YYYY-MM-DD');
    RETURN v;
  EXCEPTION WHEN others THEN
  END;
  BEGIN
    v := to_date(_s, 'DD/MM/YYYY');
    RETURN v;
  EXCEPTION WHEN others THEN
  END;
  BEGIN
    v := to_date(_s, 'DD-MM-YYYY');
    RETURN v;
  EXCEPTION WHEN others THEN
  END;
  BEGIN
    v := to_date(_s, 'MM/DD/YYYY');
    RETURN v;
  EXCEPTION WHEN others THEN
  END;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.parse_int_safe(_s text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path = public
AS $function$
BEGIN
  IF _s IS NULL OR btrim(_s) = '' THEN
    RETURN NULL;
  END IF;
  RETURN CAST(regexp_replace(_s, '[^0-9-]', '', 'g') AS integer);
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$function$;

-- 5) Harden refresh function to admin-only
CREATE OR REPLACE FUNCTION public.refresh_alunos_cache_from_raw_json(full_refresh boolean DEFAULT true)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  -- Only admins may refresh
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  -- Clear cache, if desired
  IF full_refresh THEN
    TRUNCATE TABLE public.alunos_view_cache;
  END IF;

  -- Insert mapping from staging JSON
  INSERT INTO public.alunos_view_cache (
    ra, cpf, nome, resfinanceiro, dtinicio, dtfim, ch, curso, cidade, codturma, disciplina
  )
  SELECT
    NULLIF(COALESCE(
      payload->> 'RA', payload->> 'ra', payload->> 'Matricula', payload->> 'MATRICULA', payload->> 'matricula'
    ), '') AS ra,
    NULLIF(COALESCE(
      payload->> 'CPF', payload->> 'cpf'
    ), '') AS cpf,
    NULLIF(COALESCE(
      payload->> 'NOME', payload->> 'Nome', payload->> 'nome'
    ), '') AS nome,
    NULLIF(COALESCE(
      payload->> 'RESFINCEIRO', payload->> 'ResfinCeiro', payload->> 'Empresa', payload->> 'EMPRESA', payload->> 'resfinanceiro'
    ), '') AS resfinanceiro,
    public.parse_date_safe(COALESCE(
      payload->> 'DTINICIO', payload->> 'DataInicio', payload->> 'DATA_INICIO', payload->> 'Inicio', payload->> 'inicio', payload->> 'dtinicio'
    )) AS dtinicio,
    public.parse_date_safe(COALESCE(
      payload->> 'DTFIM', payload->> 'DataFim', payload->> 'DATA_FIM', payload->> 'Fim', payload->> 'fim', payload->> 'dtfim'
    )) AS dtfim,
    public.parse_int_safe(COALESCE(
      payload->> 'CH', payload->> 'CH_TOTAL', payload->> 'CARGA_HORARIA', payload->> 'ch'
    )) AS ch,
    NULLIF(COALESCE(
      payload->> 'CURSO', payload->> 'Curso', payload->> 'curso'
    ), '') AS curso,
    NULLIF(COALESCE(
      payload->> 'CIDADE', payload->> 'Cidade', payload->> 'cidade'
    ), '') AS cidade,
    NULLIF(COALESCE(
      payload->> 'CODTURMA', payload->> 'CodTurma', payload->> 'codturma'
    ), '') AS codturma,
    NULLIF(COALESCE(
      payload->> 'DISCIPLINA', payload->> 'Disciplina', payload->> 'disciplina'
    ), '') AS disciplina
  FROM public.alunos_raw_import_json
  WHERE COALESCE(payload::text, '') <> '{}';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Clear staging after processing
  TRUNCATE TABLE public.alunos_raw_import_json;

  RETURN v_count;
END;
$function$;

-- 6) Secure search RPC with masking for consulta
CREATE OR REPLACE FUNCTION public.search_alunos(term text)
RETURNS TABLE (
  ra text,
  cpf text,
  nome text,
  dtinicio date,
  dtfim date,
  cidade text,
  resfinanceiro text,
  curso text,
  codturma text,
  disciplina text,
  ch integer
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_is_operador boolean;
  v_is_consulta boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  IF term IS NULL OR length(btrim(term)) < 3 THEN
    RAISE EXCEPTION 'term too short';
  END IF;

  v_is_admin := public.has_role(auth.uid(), 'admin');
  v_is_operador := public.has_role(auth.uid(), 'operador');
  v_is_consulta := public.has_role(auth.uid(), 'consulta');

  IF v_is_admin OR v_is_operador THEN
    RETURN QUERY
    SELECT
      avc.ra,
      avc.cpf,
      avc.nome,
      avc.dtinicio,
      avc.dtfim,
      avc.cidade,
      avc.resfinanceiro,
      avc.curso,
      avc.codturma,
      avc.disciplina,
      avc.ch
    FROM public.alunos_view_cache avc
    WHERE avc.ra ILIKE '%'||term||'%' OR avc.cpf ILIKE '%'||term||'%' OR avc.nome ILIKE '%'||term||'%'
    LIMIT 25;
    RETURN;
  ELSIF v_is_consulta THEN
    RETURN QUERY
    SELECT
      avc.ra,
      CASE
        WHEN avc.cpf IS NULL THEN NULL
        ELSE avc.cpf::text
      END AS cpf_masked,
      avc.nome,
      avc.dtinicio,
      avc.dtfim,
      avc.cidade,
      avc.resfinanceiro,
      avc.curso,
      avc.codturma,
      avc.disciplina,
      avc.ch
    FROM (
      SELECT *,
        CASE 
          WHEN cpf IS NULL THEN NULL
          ELSE substring(cpf from 1 for 3) || '******' || right(cpf, 2)
        END AS cpf
      FROM public.alunos_view_cache
    ) avc
    WHERE avc.ra ILIKE '%'||term||'%' OR avc.cpf ILIKE '%'||term||'%' OR avc.nome ILIKE '%'||term||'%'
    LIMIT 25;
    RETURN;
  ELSE
    RAISE EXCEPTION 'permission denied';
  END IF;
END;
$$;