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

/**
 * Secure search via RPC that enforces RBAC and masks CPF for consulta role.
 */
export async function searchAlunosView(term: string) {
  const { data, error } = await (supabase as any).rpc("search_alunos", { term });
  if (error) throw error;
  return (data as unknown as AlunoViewRow[]) || [];
}

export async function testViewConnection() {
  // Minimal search term length is 3 (enforced in RPC)
  const { data, error } = await (supabase as any).rpc("search_alunos", { term: "AAA" });
  if (error) throw error;
  return data?.length ?? 0;
}
