import { CalendarioEvento, Feriado } from '../../types';

export class GeradorPraticas {
  /**
   * Gera dias práticos em todos os dias úteis (seg-sex) exceto o dia teórico fixo da semana
   * - Respeita feriados e férias (eventosExistentes)
   * - Evita conflitos com eventos já existentes
   */
  static gerarDiasPraticos(
    dataInicio: Date,
    dataFim: Date,
    diaTeoricoSemana: string,
    feriados: Feriado[],
    eventosExistentes: CalendarioEvento[] = []
  ): CalendarioEvento[] {
    const praticas: CalendarioEvento[] = [];

    const data = new Date(dataInicio);
    // Iterar de dataInicio até dataFim (inclusive)
    while (data <= dataFim) {
      if (this.isDiaUtil(data)) {
        const diaSemanaNome = this.getDiaSemana(data);

        // Apenas dias úteis que não sejam o dia teórico do aluno
        if (diaSemanaNome !== diaTeoricoSemana) {
          const dataStr = data.toISOString().split('T')[0];
          const conflita = this.temConflito(data, [...eventosExistentes, ...praticas]);
          const ehFeriado = this.isFeriado(data, feriados);

          if (!conflita && !ehFeriado) {
            praticas.push({
              data: dataStr,
              tipo: 'pratica',
              descricao: 'Atividade Prática'
            });
          }
        }
      }
      // Próximo dia
      data.setDate(data.getDate() + 1);

      // Evitar loops muito longos (hard stop em +3 anos)
      if (data.getFullYear() > dataInicio.getFullYear() + 3) break;
    }

    return praticas;
  }

  private static isDiaUtil(data: Date): boolean {
    const d = data.getDay();
    return d >= 1 && d <= 5; // seg (1) a sex (5)
  }

  private static isFeriado(data: Date, feriados: Feriado[]): boolean {
    const dataStr = data.toISOString().split('T')[0];
    return feriados.some(f => f.data === dataStr);
  }

  private static temConflito(data: Date, eventos: CalendarioEvento[]): boolean {
    const dataStr = data.toISOString().split('T')[0];
    return eventos.some(e => e.data === dataStr);
  }

  private static getDiaSemana(data: Date): string {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[data.getDay()];
  }
}
