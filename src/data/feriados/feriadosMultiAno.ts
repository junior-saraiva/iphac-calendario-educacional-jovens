import { Feriado } from '@/types';

// Feriados nacionais fixos - aplicáveis para qualquer ano
const feriadosNacionaisFixos = [
  { mes: 1, dia: 1, descricao: 'Confraternização Universal' },
  { mes: 4, dia: 21, descricao: 'Tiradentes' },
  { mes: 5, dia: 1, descricao: 'Dia do Trabalho' },
  { mes: 9, dia: 7, descricao: 'Independência do Brasil' },
  { mes: 10, dia: 12, descricao: 'Nossa Senhora Aparecida' },
  { mes: 11, dia: 2, descricao: 'Finados' },
  { mes: 11, dia: 15, descricao: 'Proclamação da República' },
  { mes: 12, dia: 25, descricao: 'Natal' },
];

// Função para calcular a Páscoa usando o algoritmo de Gauss
function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(ano, mes - 1, dia);
}

// Função para gerar feriados móveis baseados na Páscoa
function gerarFeriadosMoveis(ano: number): Feriado[] {
  const pascoa = calcularPascoa(ano);
  const feriadosMoveis: Feriado[] = [];

  // Carnaval (47 dias antes da Páscoa)
  const carnaval = new Date(pascoa);
  carnaval.setDate(carnaval.getDate() - 47);
  feriadosMoveis.push({
    id: `pascoa-${ano}-carnaval`,
    data: formatarData(carnaval),
    descricao: 'Carnaval',
    nivel: 'facultativo'
  });

  // Sexta-feira Santa (2 dias antes da Páscoa)
  const sextaFeiraSanta = new Date(pascoa);
  sextaFeiraSanta.setDate(sextaFeiraSanta.getDate() - 2);
  feriadosMoveis.push({
    id: `pascoa-${ano}-sexta-santa`,
    data: formatarData(sextaFeiraSanta),
    descricao: 'Sexta-Feira Santa',
    nivel: 'nacional'
  });

  // Corpus Christi (60 dias após a Páscoa)
  const corpusChristi = new Date(pascoa);
  corpusChristi.setDate(corpusChristi.getDate() + 60);
  feriadosMoveis.push({
    id: `pascoa-${ano}-corpus-christi`,
    data: formatarData(corpusChristi),
    descricao: 'Corpus Christi',
    nivel: 'facultativo'
  });

  return feriadosMoveis;
}

// Função para formatar data como YYYY-MM-DD
function formatarData(data: Date): string {
  return data.toISOString().split('T')[0];
}

// Função principal para gerar todos os feriados de um ano
export function gerarFeriadosAno(ano: number): Feriado[] {
  const feriados: Feriado[] = [];

  // Adicionar feriados nacionais fixos
  feriadosNacionaisFixos.forEach(feriado => {
    const data = new Date(ano, feriado.mes - 1, feriado.dia);
    feriados.push({
      id: `nacional-${ano}-${String(feriado.mes).padStart(2, '0')}-${String(feriado.dia).padStart(2, '0')}`,
      data: formatarData(data),
      descricao: `${feriado.descricao} - Brasil`,
      nivel: 'nacional'
    });
  });

  // Adicionar feriados móveis
  feriados.push(...gerarFeriadosMoveis(ano));

  return feriados;
}

// Cache para armazenar feriados gerados por ano
const cacheForidosAno = new Map<number, Feriado[]>();

// Função otimizada para obter feriados de um ano (com cache)
export function obterFeriadosAno(ano: number): Feriado[] {
  if (!cacheForidosAno.has(ano)) {
    cacheForidosAno.set(ano, gerarFeriadosAno(ano));
  }
  return cacheForidosAno.get(ano)!;
}

// Função para limpar cache de um ano específico
export function limparCacheFeriadosAno(ano?: number): void {
  if (ano) {
    cacheForidosAno.delete(ano);
  } else {
    cacheForidosAno.clear();
  }
}

// Anos suportados pelo sistema
export const ANOS_SUPORTADOS = [2025, 2026, 2027, 2028, 2029] as const;
export type AnoSuportado = typeof ANOS_SUPORTADOS[number];

// Função para validar se um ano é suportado
export function isAnoSuportado(ano: number): ano is AnoSuportado {
  return ANOS_SUPORTADOS.includes(ano as AnoSuportado);
}