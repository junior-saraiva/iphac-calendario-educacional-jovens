import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import HelpPanel from "@/components/HelpPanel";

// Tipos auxiliares
type Mode = "UNICO" | "FAIXA";
type ScopeUI = "BR" | "UF" | "MUNICIPIO";

interface FeriadoRow {
  data: string;
  descricao?: string | null;
  nome?: string | null;
  tipo?: string | null;
  uf?: string | null;
  ibge_code?: number | string | null;
  ano?: number | null;
}

const DEFAULT_START = 2025;
const DEFAULT_END = 2030;

export default function AdminImportacaoFeriados() {
  const { toast } = useToast();

  // Form state
  const [mode, setMode] = useState<Mode>("UNICO");
  const [year, setYear] = useState<number>(DEFAULT_START);
  const [startYear, setStartYear] = useState<number>(DEFAULT_START);
  const [endYear, setEndYear] = useState<number>(DEFAULT_END);
  const [scope, setScope] = useState<ScopeUI>("BR");
  const [uf, setUf] = useState<string>("");
  const [ibgeCode, setIbgeCode] = useState<string>("");

  // Grid state
  const [rows, setRows] = useState<FeriadoRow[]>([]);
  const [loadingGrid, setLoadingGrid] = useState<boolean>(false);
  const [ufFilter, setUfFilter] = useState<string>("");
  const [ibgeFilter, setIbgeFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [total, setTotal] = useState<number>(0);

  const effectiveStart = useMemo(() => (mode === "UNICO" ? year : startYear), [mode, year, startYear]);
  const effectiveEnd = useMemo(() => (mode === "UNICO" ? year : endYear), [mode, year, endYear]);

  const scopeToApi = (s: ScopeUI): "nacional" | "estadual" | "municipal" => {
    if (s === "UF") return "estadual";
    if (s === "MUNICIPIO") return "municipal";
    return "nacional";
  };

  // Carrega grid do Supabase (ano entre 2025 e 2030)
  const fetchGrid = useCallback(async () => {
    setLoadingGrid(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;


      let query: any = (supabase.from as any)("feriado")
        .select("data,descricao,tipo,uf,ibge_code,ano", { count: "exact" })
        .gte("ano", DEFAULT_START)
        .lte("ano", DEFAULT_END)
        .order("data", { ascending: true });

      if (ufFilter) query = query.eq("uf", ufFilter.toUpperCase());
      if (ibgeFilter) query = query.eq("ibge_code", isNaN(Number(ibgeFilter)) ? ibgeFilter : Number(ibgeFilter));

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      setRows((data as any[]) as FeriadoRow[] || []);
      setTotal(count || 0);
    } catch (e: any) {
      toast({ title: "Erro ao carregar grid", description: e?.message ?? String(e), variant: "destructive" });
      setRows([]);
      setTotal(0);
    } finally {
      setLoadingGrid(false);
    }
  }, [page, pageSize, ufFilter, ibgeFilter, toast]);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  // Importar
  const [submitting, setSubmitting] = useState(false);
  const runImport = useCallback(async (payload: any) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("importar_feriados", { body: payload });
      if (error) throw error;

      const res: any = data;
      toast({
        title: `Importação: ${res?.status ?? "ok"}`,
        description: `Processados: ${res?.metrics?.totals?.processed ?? 0} • Inseridos/Atualizados: ${res?.metrics?.totals?.inserted_or_updated ?? 0} • Erros: ${res?.metrics?.totals?.errors ?? 0}`,
      });
      await fetchGrid();
      return res;
    } catch (e: any) {
      toast({ title: "Falha na importação", description: e?.message ?? String(e), variant: "destructive" });
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [toast, fetchGrid]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Monta payload: prioriza years[] quando modo UNICO
    const payload: any = {
      scope: scopeToApi(scope),
    };

    if (scope !== "BR" && uf) payload.uf = uf.toUpperCase();
    if (scope === "MUNICIPIO" && ibgeCode) payload.ibge_code = isNaN(Number(ibgeCode)) ? ibgeCode : Number(ibgeCode);

    if (mode === "UNICO") {
      payload.years = [year];
    } else {
      payload.start_year = startYear;
      payload.end_year = endYear;
    }

    // Validação básica 2025..2030
    const yearsArr: number[] = payload.years ?? [];
    const st = payload.start_year ?? yearsArr[0];
    const en = payload.end_year ?? yearsArr[yearsArr.length - 1];
    if (st < 2025 || en > 2030) {
      toast({ title: "Intervalo inválido", description: "Use anos entre 2025 e 2030", variant: "destructive" });
      return;
    }

    await runImport(payload);
  };

  const onPreload = async () => {
    const payload: any = {
      scope: scopeToApi(scope),
      start_year: DEFAULT_START,
      end_year: DEFAULT_END,
    };
    if (scope !== "BR" && uf) payload.uf = uf.toUpperCase();
    if (scope === "MUNICIPIO" && ibgeCode) payload.ibge_code = isNaN(Number(ibgeCode)) ? ibgeCode : Number(ibgeCode);
    await runImport(payload);
  };

  const exportCsv = () => {
    const data = rows.map((r) => ({
      data: r.data,
      nome: r.nome ?? r.descricao ?? "",
      tipo: r.tipo ?? "",
      uf: r.uf ?? "",
      ibge_code: r.ibge_code ?? "",
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feriados_${DEFAULT_START}-${DEFAULT_END}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <HelpPanel pageKey="admin-importar-feriados">
        <ul className="list-disc pl-5 space-y-1">
          <li>Escolha Modo: Único (1 ano) ou Faixa (início–fim).</li>
          <li>Defina Escopo: BR, UF ou Município; informe UF/IBGE quando aplicável.</li>
          <li>Clique em Importar para o intervalo desejado (permitido 2025–2030).</li>
          <li>Use Pré-carregar 2025–2030 para carregar rapidamente todos os anos.</li>
          <li>Filtre a tabela por UF/IBGE; exporte a visualização atual em CSV.</li>
        </ul>
      </HelpPanel>
      <section className="space-y-4">
        <h1 className="text-xl font-semibold">Admin • Importar Feriados</h1>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          {/* Modo */}
          <div className="md:col-span-1">
            <Label>Modo</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UNICO">Único</SelectItem>
                <SelectItem value="FAIXA">Faixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "UNICO" ? (
            <div className="md:col-span-1">
              <Label>Ano</Label>
              <Input type="number" min={2025} max={2030} value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          ) : (
            <>
              <div className="md:col-span-1">
                <Label>Início</Label>
                <Input type="number" min={2025} max={2030} value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} />
              </div>
              <div className="md:col-span-1">
                <Label>Fim</Label>
                <Input type="number" min={2025} max={2030} value={endYear} onChange={(e) => setEndYear(Number(e.target.value))} />
              </div>
            </>
          )}

          {/* Scope */}
          <div className="md:col-span-1">
            <Label>Escopo</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as ScopeUI)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BR">BR</SelectItem>
                <SelectItem value="UF">UF</SelectItem>
                <SelectItem value="MUNICIPIO">Município</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* UF */}
          <div className="md:col-span-1">
            <Label>UF</Label>
            <Input placeholder="Ex.: SP" value={uf} onChange={(e) => setUf(e.target.value)} disabled={scope === "BR"} />
          </div>

          {/* IBGE */}
          <div className="md:col-span-1">
            <Label>IBGE</Label>
            <Input placeholder="Ex.: 3550308" value={ibgeCode} onChange={(e) => setIbgeCode(e.target.value)} disabled={scope !== "MUNICIPIO"} />
          </div>

          {/* Ações */}
          <div className="md:col-span-6 flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? "Importando..." : "Importar"}</Button>
            <Button type="button" variant="secondary" onClick={onPreload} disabled={submitting}>Pré-carregar 2025–2030</Button>
            <Button type="button" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>Exportar CSV</Button>
          </div>
        </form>
      </section>

      {/* Filtros Grid */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Filtro UF</Label>
            <Input placeholder="UF" value={ufFilter} onChange={(e) => { setPage(1); setUfFilter(e.target.value); }} />
          </div>
          <div>
            <Label>Filtro IBGE</Label>
            <Input placeholder="Código IBGE" value={ibgeFilter} onChange={(e) => { setPage(1); setIbgeFilter(e.target.value); }} />
          </div>
          <div>
            <Label>Itens por página</Label>
            <Select value={String(pageSize)} onValueChange={(v) => { setPage(1); setPageSize(Number(v)); }}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            {loadingGrid ? "Carregando..." : `${total} itens • Página ${page}/${totalPages}`}
          </div>
        </div>

        {/* Tabela simples */}
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">UF</th>
                <th className="text-left p-2">IBGE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.data}-${idx}`} className="border-t">
                  <td className="p-2 whitespace-nowrap">{r.data}</td>
                  <td className="p-2">{r.nome ?? r.descricao ?? ""}</td>
                  <td className="p-2">{r.tipo ?? ""}</td>
                  <td className="p-2">{r.uf ?? ""}</td>
                  <td className="p-2">{r.ibge_code ?? ""}</td>
                </tr>
              ))}
              {!loadingGrid && rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-muted-foreground" colSpan={5}>Nenhum registro</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
          <span className="text-sm">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Próxima</Button>
        </div>
      </section>
    </div>
  );
}
