
/**
 * importar_municipios - Função Edge (TypeScript/Deno)
 * - Somente admin (usa RPC has_role)
 * - Busca JSON de municípios do GitHub
 * - Normaliza e faz upsert em public.municipio (onConflict: ibge_code)
 * - Responde com métricas
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS padrão
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MunicipioRow = {
  ibge_code: string;
  nome: string;
  uf: string;
  nome_uf?: string | null;
  microrregiao?: string | null;
  mesorregiao?: string | null;
};

type SourceItem = Record<string, any>;

const SOURCE_URL = "https://raw.githubusercontent.com/joaopbini/feriados-brasil/master/dados/municipios.json";

// Helpers
function str(v: any): string {
  return (v ?? "").toString().trim();
}

function upper(v: any): string {
  return str(v).toUpperCase();
}

function nullable(v: any): string | null {
  const s = str(v);
  return s.length ? s : null;
}

function normalizeItem(it: SourceItem): MunicipioRow | null {
  // Mapeia variações comuns de chaves
  const ibge =
    str(it.ibge_code ?? it.codigo_ibge ?? it.codigoIBGE ?? it.ibge ?? it.codigo);
  const nome = str(it.nome ?? it.municipio ?? it.cidade);
  const uf = upper(it.uf ?? it.estado ?? it.sigla_uf);

  if (!ibge || !nome || !uf) return null;

  const nome_uf = nullable(it.nome_uf ?? it.estado_nome ?? it.nomeEstado);
  const microrregiao = nullable(it.microrregiao ?? it.microregiao);
  const mesorregiao = nullable(it.mesorregiao ?? it.mesoregiao);

  return {
    ibge_code: ibge,
    nome,
    uf,
    nome_uf,
    microrregiao,
    mesorregiao,
  };
}

async function fetchMunicipios(url = SOURCE_URL): Promise<SourceItem[]> {
  const resp = await fetch(url, { headers: { accept: "application/json" } });
  if (!resp.ok) {
    throw new Error(`Falha ao buscar municipios.json (${resp.status})`);
  }
  const data = await resp.json();
  // aceita array direto ou objeto com propriedade "items" / "municipios"
  if (Array.isArray(data)) return data as SourceItem[];
  if (Array.isArray((data as any)?.items)) return (data as any).items;
  if (Array.isArray((data as any)?.municipios)) return (data as any).municipios;
  throw new Error("Formato inesperado de municipios.json");
}

Deno.serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY env" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  try {
    // Autenticação/Autorização
    const { data: auth, error: authErr } = await client.auth.getUser();
    if (authErr || !auth?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin, error: roleErr } = await client.rpc("has_role", {
      _user_id: auth.user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden - admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Permite override de URL via body (opcional)
    const body = await req.json().catch(() => ({}));
    const sourceUrl = str(body?.source_url) || SOURCE_URL;

    // Fetch e normalização
    const rawItems = await fetchMunicipios(sourceUrl);
    const rows: MunicipioRow[] = [];
    for (const item of rawItems) {
      const norm = normalizeItem(item);
      if (norm) rows.push(norm);
    }

    // Upsert em lotes
    const metrics = {
      processed: rawItems.length,
      normalized: rows.length,
      inserted_or_updated: 0,
      errors: [] as string[],
      source_url: sourceUrl,
    };

    const batchSize = 2000;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { data: upsertData, error: upsertErr } = await client
        .from("municipio")
        .upsert(batch, { onConflict: "ibge_code" });

      if (upsertErr) {
        metrics.errors.push(upsertErr.message);
      } else {
        const affected = Array.isArray(upsertData) ? upsertData.length : batch.length;
        metrics.inserted_or_updated += affected;
      }
    }

    const status = metrics.errors.length ? "completed_with_warnings" : "completed";
    return new Response(JSON.stringify({ status, metrics }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
