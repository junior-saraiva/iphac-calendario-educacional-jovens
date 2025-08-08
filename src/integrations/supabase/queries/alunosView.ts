import { supabase } from "@/integrations/supabase/client";

export interface AlunoViewRow {
  ra: string; // RA (Matrícula)
  cpf: string;
  nome: string;
  dtinicio: string | null; // ISO date
  dtfim: string | null; // ISO date
  cidade: string | null;
  resfinanceiro: string | null; // Empresa (nome)
  curso: string | null;
  codturma: string | null;
  disciplina: string | null;
  ch: number | null;
}

const VIEW_NAME = "VW_DADOS_ALUNOS_DISCIPLINAS_ATIVOS";
const SELECT_ALUNO = [
  "ra:RA",
  "cpf:CPF",
  "nome:NOME",
  "dtinicio:DTINICIO",
  "dtfim:DTFIM",
  "cidade:CIDADE",
  "resfinanceiro:RESFINCEIRO",
  "curso:CURSO",
  "codturma:CODTURMA",
  "disciplina:DISCIPLINA",
  "ch:CH",
].join(", ");

export async function searchAlunosView(term: string) {
  // Busca por RA, CPF ou Nome (ilike)
  const q = (supabase as any)
    .from(VIEW_NAME)
    .select(SELECT_ALUNO)
    .or(
      [
        `RA.ilike.%${term}%`,
        `CPF.ilike.%${term}%`,
        `NOME.ilike.%${term}%`,
      ].join(",")
    )
    .limit(25);

  const { data, error } = await q;
  if (error) throw error;

  // Tipar a saída
  return (data as unknown as AlunoViewRow[]) || [];
}

export async function testViewConnection() {
  const { data, error } = await (supabase as any)
    .from(VIEW_NAME)
    .select("RA")
    .limit(1);
  if (error) throw error;
  return data?.length ?? 0;
}
