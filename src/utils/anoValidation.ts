import { ANOS_SUPORTADOS, AnoSuportado } from '@/data/feriados/feriadosMultiAno';

/**
 * Valida se uma data está dentro dos anos suportados pelo sistema
 */
export function validarAnoSuportado(data: Date): { valido: boolean; ano: number; erro?: string } {
  const ano = data.getFullYear();
  
  if (!ANOS_SUPORTADOS.includes(ano as AnoSuportado)) {
    return {
      valido: false,
      ano,
      erro: `Ano ${ano} não é suportado. Anos disponíveis: ${ANOS_SUPORTADOS.join(', ')}`
    };
  }
  
  return { valido: true, ano };
}

/**
 * Ajusta uma data para o primeiro ano suportado se necessário
 */
export function ajustarDataParaAnoSuportado(data: Date): Date {
  const validacao = validarAnoSuportado(data);
  
  if (!validacao.valido) {
    // Se o ano não for suportado, usar o primeiro ano suportado (2025)
    const dataAjustada = new Date(data);
    dataAjustada.setFullYear(ANOS_SUPORTADOS[0]);
    return dataAjustada;
  }
  
  return data;
}

/**
 * Valida se um período de datas está dentro dos anos suportados
 */
export function validarPeriodoAnosSuportados(
  dataInicio: Date, 
  dataFim: Date
): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  
  const validacaoInicio = validarAnoSuportado(dataInicio);
  const validacaoFim = validarAnoSuportado(dataFim);
  
  if (!validacaoInicio.valido) {
    erros.push(`Data de início: ${validacaoInicio.erro}`);
  }
  
  if (!validacaoFim.valido) {
    erros.push(`Data de fim: ${validacaoFim.erro}`);
  }
  
  // Verificar se o período não ultrapassa mais de 2 anos
  const diferencaAnos = dataFim.getFullYear() - dataInicio.getFullYear();
  if (diferencaAnos > 2) {
    erros.push('O período do calendário não pode ultrapassar 2 anos');
  }
  
  return {
    valido: erros.length === 0,
    erros
  };
}