import { useMemo, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Upload } from "lucide-react";

// Campos canônicos aceitos pela função refresh_alunos_cache_from_raw_json
// Mantemos nomes que o SQL já reconhece, evitando mudanças no backend
const CANONICAL_FIELDS: { key: string; label: string; required?: boolean; synonyms?: string[] }[] = [
  { key: "RA", label: "RA (Matrícula)", required: true, synonyms: ["matricula", "ra"] },
  { key: "CPF", label: "CPF", synonyms: ["cpf"] },
  { key: "NOME", label: "Nome", required: true, synonyms: ["nome"] },
  // Atenção ao erro comum: RESPFINANCEIRO (CSV) vs RESFINCEIRO (SQL)
  { key: "RESFINCEIRO", label: "Empresa (Responsável Financeiro)", synonyms: ["empresa", "EMPRESA", "RESPFINANCEIRO", "resfinanceiro", "resfinCeiro", "resfinceiro"] },
  { key: "DTINICIO", label: "Data Início", synonyms: ["data_inicio", "inicio", "dtinicio", "data inicio"] },
  { key: "DTFIM", label: "Data Fim", synonyms: ["data_fim", "fim", "dtfim", "data fim"] },
  { key: "CH", label: "Carga Horária (CH)", synonyms: ["ch_total", "carga_horaria", "ch"] },
  { key: "CURSO", label: "Curso", synonyms: ["curso"] },
  { key: "CIDADE", label: "Cidade", synonyms: ["cidade"] },
  { key: "CODTURMA", label: "Código da Turma", synonyms: ["codturma", "codigo_turma"] },
  { key: "DISCIPLINA", label: "Disciplina", synonyms: ["disciplina"] },
];

// Normaliza strings para facilitar matching de cabeçalhos
function normalize(s?: string | null) {
  return (s || "")
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Z0-9_]/g, "");
}

const NONE_VALUE = "__NONE__";

// Sugere mapeamento automático por similaridade de nomes
function autoMap(headers: string[]) {
  const map: Record<string, string | null> = {};
  const normHeaders = headers.map((h) => ({ raw: h, norm: normalize(h) }));

  for (const field of CANONICAL_FIELDS) {
    // 1) match exato
    let match = normHeaders.find((h) => h.norm === normalize(field.key));
    if (!match && field.synonyms?.length) {
      // 2) match por sinônimos
      match = normHeaders.find((h) => field.synonyms!.some((syn) => h.norm === normalize(syn)));
    }
    // 3) heurística: começa com
    if (!match) {
      match = normHeaders.find((h) => h.norm.startsWith(normalize(field.key)));
    }
    map[field.key] = match?.raw ?? null;
  }
  return map;
}

// Sanitiza cabeçalhos vazios/duplicados e reatribui linhas para usar os nomes sanitizados
function sanitizeHeadersAndRows(rawHeaders: string[], rows: any[]): { headers: string[]; rows: Record<string, any>[] } {
  const headers: string[] = [];
  const counts: Record<string, number> = {};

  const getUnique = (base: string) => {
    const b = base || "COL";
    counts[b] = (counts[b] || 0) + 1;
    return counts[b] === 1 ? b : `${b}_${counts[b]}`;
  };

  rawHeaders.forEach((h, idx) => {
    const trimmed = (h ?? "").toString().trim();
    const base = trimmed ? trimmed : `COL_${idx + 1}`;
    const norm = base.replace(/\s+/g, "_");
    headers.push(getUnique(norm));
  });

  const outRows = rows.map((r) => {
    const o: Record<string, any> = {};
    rawHeaders.forEach((raw, idx) => {
      const key = headers[idx];
      o[key] = r[raw];
    });
    return o;
  });

  return { headers, rows: outRows };
}

interface ParsedCsv {
  headers: string[];
  rows: Record<string, any>[]; // com chaves iguais aos headers originais
}

export default function ImportadorCSV() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [hasHeader, setHasHeader] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [fullRefresh, setFullRefresh] = useState(true);
  const [inserted, setInserted] = useState(0);

  const handleFile = (f: File | null) => {
    setFile(f);
    setParsed(null);
    setMapping({});
    setInserted(0);
  };

  const parseFile = async () => {
    if (!file) return;
    return new Promise<void>((resolve, reject) => {
      Papa.parse(file, {
        header: hasHeader,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          try {
            const rows: any[] = results.data as any[];
            let headers: string[] = [];
            let normalizedRows: Record<string, any>[] = [];

            if (hasHeader) {
              const rawHeaders: string[] = (results.meta.fields as string[]) || [];
              const sanitized = sanitizeHeadersAndRows(rawHeaders, rows);
              headers = sanitized.headers;
              normalizedRows = sanitized.rows;
            } else {
              headers = Array.from({ length: (rows[0] as any[])?.length || 0 }, (_, i) => `COL_${i + 1}`);
              normalizedRows = rows.map((arr) => {
                const obj: Record<string, any> = {};
                headers.forEach((h, i) => (obj[h] = (arr as any[])[i]));
                return obj;
              });
            }

            setParsed({ headers, rows: normalizedRows });
            setMapping(autoMap(headers));
            toast({ title: "CSV analisado", description: `Colunas detectadas: ${headers.length}. Linhas: ${normalizedRows.length}` });
            resolve();
          } catch (e: any) {
            reject(e);
          }
        },
        error: (err) => reject(err),
      });
    });
  };

  const onStartImport = async () => {
    if (!parsed) return;

    // Monta payload normalizado por linha
    const payloads = parsed.rows.map((row) => {
      const payload: Record<string, any> = { ...row }; // preserva tudo
      // injeta campos canônicos esperados pelo SQL
      for (const f of CANONICAL_FIELDS) {
        const srcHeader = mapping[f.key];
        if (srcHeader && row.hasOwnProperty(srcHeader)) {
          payload[f.key] = row[srcHeader];
        }
      }
      // Correção de chave comum: RESPFINANCEIRO -> RESFINCEIRO
      if (payload["RESPFINANCEIRO"] && !payload["RESFINCEIRO"]) {
        payload["RESFINCEIRO"] = payload["RESPFINANCEIRO"];
      }
      return { payload };
    });

    const BATCH = 500; // tamanho de lote seguro
    setIsImporting(true);
    setInserted(0);

    try {
      // Inserção em lotes na tabela JSON
      for (let i = 0; i < payloads.length; i += BATCH) {
        const chunk = payloads.slice(i, i + BATCH);
        const { error } = await supabase.from("alunos_raw_import_json").insert(chunk);
        if (error) throw error;
        setInserted((prev) => prev + chunk.length);
      }

      // Chama refresh do cache
      const { data, error: rpcError } = await (supabase as any).rpc(
        "refresh_alunos_cache_from_raw_json",
        { full_refresh: fullRefresh }
      );
      if (rpcError) throw rpcError;

      toast({
        title: "Importação concluída",
        description: `Registros importados: ${payloads.length}. Cache atualizado: ${data ?? 0} linhas.`,
      });
    } catch (e: any) {
      const msg = e?.message || "Erro ao importar";
      toast({ title: "Falha na importação", description: msg, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const canStart = useMemo(() => !!parsed && !isImporting, [parsed, isImporting]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" /> Importador CSV (Admin)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Arquivo CSV</Label>
            <Input type="file" accept=".csv" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                id="hasHeader"
                type="checkbox"
                className="h-4 w-4"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
              />
              <Label htmlFor="hasHeader">Arquivo possui cabeçalho</Label>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                id="fullRefresh"
                type="checkbox"
                className="h-4 w-4"
                checked={fullRefresh}
                onChange={(e) => setFullRefresh(e.target.checked)}
              />
              <Label htmlFor="fullRefresh">Atualização completa do cache (recomendado)</Label>
            </div>
            <div>
              <Button onClick={parseFile} disabled={!file || isImporting} variant="outline">
                Analisar CSV
              </Button>
            </div>
            {!parsed && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Apenas usuários com papel Admin podem concluir a importação.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Mapeamento de Colunas</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CANONICAL_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Select
                    value={mapping[f.key] ?? NONE_VALUE}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === NONE_VALUE ? null : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      <SelectItem value={NONE_VALUE}>(não mapear)</SelectItem>
                      {parsed?.headers.map((h) => (
                        <SelectItem key={`${f.key}-${h}`} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {parsed ? (
              <>Linhas carregadas: {parsed.rows.length}. Registros inseridos: {inserted}.</>
            ) : (
              <>Carregue e analise um arquivo CSV para continuar.</>
            )}
          </div>
          <Button onClick={onStartImport} disabled={!canStart}>
            {isImporting ? "Importando..." : "Importar e Atualizar Cache"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
