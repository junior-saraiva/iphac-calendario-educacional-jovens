import { Feriado } from '@/types';
import { feriadosNacionais2025 } from './feriados_nacionais_2025';
import { feriadosEstaduais2025 } from './feriados_estaduais_2025';
import { feriadosFacultativos2025 } from './feriados_facultativos_2025';
// import { feriadosMunicipais2025 } from './index_feriados_municipais_2025'; // Temporariamente comentado devido a erros de sintaxe

// Arquivo final combinando todos os feriados reais de 2025
export const feriadosReaisCombinados2025: Feriado[] = [
  ...feriadosNacionais2025,
  ...feriadosEstaduais2025,
  ...feriadosFacultativos2025,
  // ...feriadosMunicipais2025, // Temporariamente comentado devido a erros de sintaxe
];

// Estatísticas dos feriados por tipo
export const estatisticasFeriados2025 = {
  nacionais: feriadosNacionais2025.length,
  estaduais: feriadosEstaduais2025.length,
  facultativos: feriadosFacultativos2025.length,
  municipais: 0, // feriadosMunicipais2025.length, // Temporariamente 0 devido a erros de sintaxe
  total: feriadosReaisCombinados2025.length,
};

// Função para filtrar feriados por nível
export function filtrarFeriadosPorNivel(nivel: Feriado['nivel']): Feriado[] {
  return feriadosReaisCombinados2025.filter(feriado => feriado.nivel === nivel);
}

// Função para buscar feriados por data
export function buscarFeriadoPorData(data: string): Feriado | undefined {
  return feriadosReaisCombinados2025.find(feriado => feriado.data === data);
}

// Função para buscar feriados por mês
export function buscarFeriadosPorMes(ano: number, mes: number): Feriado[] {
  const mesFormatado = mes.toString().padStart(2, '0');
  return feriadosReaisCombinados2025.filter(feriado => 
    feriado.data.startsWith(`${ano}-${mesFormatado}`)
  );
}