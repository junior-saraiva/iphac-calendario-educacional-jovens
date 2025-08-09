// importar_feriados - Esqueleto de função Edge (TypeScript/Deno)
// - Valida entrada via Zod
// - Expande anos e itera por ano
// - Faz fetch de fontes (GitHub) por escopo/ano
// - Normaliza e faz upsert em public.feriado (idempotente)
// - Registra execução em public.import_run com métricas
// - Requer usuário autenticado com role admin

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// CORS padrão para funções chamadas via web
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Schema de entrada
const InputSchema = z.object({
  start_year: z.number().int().gte(2000).lte(2100),
  end_year: z.number().int().gte(2000).lte(2100),
  scope: z.enum(["nacional", "estadual", "municipal", "facultativo"]),
  uf: z.string().optional(),
  ibge_code: z.union([z.string(), z.number()]).optional(),
});

type Input = z.infer<typeof InputSchema>;

// Tipos mínimos normalizados para upsert (ajuste conforme schema real da tabela public.feriado)
interface FeriadoRow {
  data: string; // YYYY-MM-DD
  ano?: number; // ajuda com índice por ano
  descricao?: string;
  tipo: string; // nacional/estadual/municipal/facultativo
  uf?: string | null;
  ibge_code?: number | null;
}

// Util: range inclusivo de anos
function expandYears(start: number, end: number): number[] {
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  return Array.from({ length: e - s + 1 }, (_, i) => s + i);
}

// Monta URLs da fonte (placeholder). Ajuste os paths conforme o repositório real
function buildSourceUrls(year: number, scope: Input["scope"], uf?: string, ibge_code?: string | number): string[] {
  const base = "https://raw.githubusercontent.com/joaopbini/feriados-brasil/main";
  const list: string[] = [];
  // Exemplos de caminhos (SUBSTITUA conforme estrutura real do repo):
  if (scope === "nacional") {
    list.push(`${base}/${year}/nacionais.json`);
  } else if (scope === "facultativo") {
    list.push(`${base}/${year}/facultativos.json`);
  } else if (scope === "estadual" && uf) {
    list.push(`${base}/${year}/estados/${uf.toUpperCase()}.json`);
  } else if (scope === "municipal") {
    // Preferir ibge_code; fallback por UF + cidades (depende do repo)
    if (ibge_code != null) {
      list.push(`${base}/${year}/municipios/${String(ibge_code)}.json`);
    } else if (uf) {
      // Fallback genérico por UF
      list.push(`${base}/${year}/municipios/${uf.toUpperCase()}.json`);
    }
  }
  return list;
}

// Parser simples que tenta JSON; você pode adaptar para CSV, etc.
async function parseSource(text: string): Promise<any[]> {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.items)) return (data as any).items;
    return [];
  } catch {
    // TODO: adicionar parser CSV se necessário
    return [];
  }
}

// Normaliza objetos de diversas fontes para FeriadoRow
function normalizeItems(items: any[], opts: { scope: Input["scope"]; uf?: string; ibge_code?: string | number; year: number; }): FeriadoRow[] {
  const { scope, uf, ibge_code, year } = opts;
  return items.map((it) => {
    // Tenta mapear campos mais comuns
    const rawDate: string = it.data || it.date || it.dt || it.dia || "";
    const data = normalizeToISO(rawDate, year);
    const desc: string | undefined = it.descricao || it.description || it.nome || it.title;
    const row: FeriadoRow = {
      data,
      ano: safeYearFromDate(data) ?? year,
      descricao: desc,
      tipo: String(it.tipo || scope),
      uf: (it.uf || uf || null) ? String(it.uf || uf).toUpperCase() : null,
      ibge_code: it.ibge_code != null
        ? Number(it.ibge_code)
        : ibge_code != null
          ? Number(ibge_code)
          : null,
    };
    return row;
  }).filter((r) => r.data);
}

function normalizeToISO(input: string, fallbackYear: number): string {
  if (!input) return "";
  // Aceita YYYY-MM-DD ou DD/MM/YYYY, etc. Caso sem ano, injeta fallbackYear
  const t = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
    const [d, m, y] = t.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{1,2}\/\d{1,2}$/.test(t)) {
    const [d, m] = t.split("/");
    const y = String(fallbackYear);
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  // Último recurso: tenta Date
  const d = new Date(t);
  if (!isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
}

function safeYearFromDate(iso: string): number | undefined {
  const m = iso.match(/^(\d{4})-\d{2}-\d{2}$/);
  return m ? Number(m[1]) : undefined;
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
    const body = await req.json().catch(() => ({}));
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const input = parsed.data;
    const years = expandYears(input.start_year, input.end_year);

    // Autenticação e autorização: exige admin
    const { data: auth, error: authErr } = await client.auth.getUser();
    if (authErr || !auth?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: isAdmin, error: roleErr } = await client.rpc("has_role", {
      _user_id: auth.user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cria run log inicial
    const { data: runRow, error: runErr } = await client
      .from("import_run")
      .insert({
        years,
        scope: input.scope,
        uf: input.uf ?? null,
        ibge_code: input.ibge_code ?? null,
        status: "running",
        metrics: {},
        payload: input,
      })
      .select("id")
      .maybeSingle();

    if (runErr || !runRow) {
      return new Response(
        JSON.stringify({ error: "Failed to create import_run", details: runErr?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const runId = runRow.id as string;

    // Métricas agregadas
    const metrics: Record<string, any> = {
      totals: { processed: 0, inserted_or_updated: 0, errors: 0 },
      perYear: {} as Record<string, { processed: number; inserted_or_updated: number; errors: number }>,
      errors: [] as { year: number; url?: string; message: string }[],
      source_urls: [] as string[],
    };

    // Processa por ano
    for (const year of years) {
      const yearKey = String(year);
      metrics.perYear[yearKey] = { processed: 0, inserted_or_updated: 0, errors: 0 };

      const urls = buildSourceUrls(year, input.scope, input.uf, input.ibge_code);
      metrics.source_urls.push(...urls);

      // Coleta de itens normalizados deste ano
      const rowsForYear: FeriadoRow[] = [];

      for (const url of urls) {
        try {
          const resp = await fetch(url, { headers: { "accept": "application/json" } });
          if (!resp.ok) {
            metrics.errors.push({ year, url, message: `fetch ${resp.status}` });
            metrics.totals.errors += 1;
            metrics.perYear[yearKey].errors += 1;
            continue;
          }
          const text = await resp.text();
          const items = await parseSource(text);
          const norm = normalizeItems(items, {
            scope: input.scope,
            uf: input.uf,
            ibge_code: input.ibge_code,
            year,
          });
          rowsForYear.push(...norm);
        } catch (e: any) {
          metrics.errors.push({ year, url, message: e?.message ?? String(e) });
          metrics.totals.errors += 1;
          metrics.perYear[yearKey].errors += 1;
        }
      }

      // Upsert batelado (ajuste tamanho do lote conforme necessário)
      const batchSize = 1000;
      for (let i = 0; i < rowsForYear.length; i += batchSize) {
        const batch = rowsForYear.slice(i, i + batchSize);
        if (batch.length === 0) continue;

        // IMPORTANTE: onConflict com expressões só funciona se existir um índice único correspondente.
        // Conforme solicitado: on conflict (data, coalesce(uf,''), coalesce(ibge_code,0), tipo)
        // O PostgREST pode não aceitar expressões aqui; se falhar, troque para ON CONSTRAINT <nome_do_indice_unico>
        const { data: upsertData, error: upsertErr } = await client
          .from("feriado")
          .upsert(batch, {
            ignoreDuplicates: false,
            onConflict: "data, coalesce(uf,''), coalesce(ibge_code,0), tipo",
          });

        metrics.totals.processed += batch.length;
        metrics.perYear[yearKey].processed += batch.length;

        if (upsertErr) {
          metrics.errors.push({ year, message: upsertErr.message });
          metrics.totals.errors += 1;
          metrics.perYear[yearKey].errors += 1;
        } else {
          // PostgREST não retorna contagem por padrão; estimamos por tamanho do batch quando sem erro
          const affected = Array.isArray(upsertData) ? upsertData.length : batch.length;
          metrics.totals.inserted_or_updated += affected;
          metrics.perYear[yearKey].inserted_or_updated += affected;
        }
      }
    }

    // Conclui run
    const finalStatus = metrics.errors.length > 0 ? "completed_with_warnings" : "completed";
    const { error: updErr } = await client
      .from("import_run")
      .update({ status: finalStatus, metrics })
      .eq("id", runId);

    if (updErr) {
      return new Response(
        JSON.stringify({ run_id: runId, error: "Failed to finalize import_run", details: updErr.message, metrics }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ run_id: runId, years, status: finalStatus, metrics }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
