import { CalendarioEvento, Feriado, Disciplina } from '../../types';

export class GeradorPorDisciplina {
  /**
   * Gera eventos de calendário baseado nas disciplinas configuradas
   */
  static gerarEventosPorDisciplinas(
    dataInicio: Date,
    disciplinas: Disciplina[],
    diaAulaSemana: string,
    feriados: Feriado[],
    eventosExistentes: CalendarioEvento[] = []
  ): CalendarioEvento[] {
    const eventos: CalendarioEvento[] = [];
    let dataAtual = new Date(dataInicio);
    
    // Ajustar para o primeiro dia útil se necessário
    dataAtual = this.ajustarParaPrimeiroDiaUtil(dataAtual, feriados);
    
    for (const disciplina of disciplinas) {
      const eventosDisciplina = this.gerarEventosDisciplina(
        dataAtual,
        disciplina,
        diaAulaSemana,
        feriados,
        [...eventosExistentes, ...eventos]
      );
      
      eventos.push(...eventosDisciplina);
      
      // Atualizar data atual para a próxima disciplina
      if (eventosDisciplina.length > 0) {
        const ultimoEvento = eventosDisciplina[eventosDisciplina.length - 1];
        dataAtual = new Date(ultimoEvento.data);
        dataAtual.setDate(dataAtual.getDate() + 1);
        dataAtual = this.ajustarParaPrimeiroDiaUtil(dataAtual, feriados);
      }
    }
    
    return eventos;
  }
  
  /**
   * Gera eventos para uma disciplina específica
   */
  private static gerarEventosDisciplina(
    dataInicio: Date,
    disciplina: Disciplina,
    diaAulaSemana: string,
    feriados: Feriado[],
    eventosExistentes: CalendarioEvento[]
  ): CalendarioEvento[] {
    const eventos: CalendarioEvento[] = [];
    let dataAtual = new Date(dataInicio);
    let encontrosGerados = 0;
    
    while (encontrosGerados < disciplina.quantidade_encontros) {
      // Verificar se é dia útil e não é feriado
      if (this.isDiaUtil(dataAtual) && !this.isFeriado(dataAtual, feriados) && !this.temConflito(dataAtual, eventosExistentes)) {
        const diaSemanaNome = this.getDiaSemana(dataAtual);
        
        // Aula teórica no dia específico da semana
        if (diaSemanaNome === diaAulaSemana) {
          eventos.push({
            data: dataAtual.toISOString().split('T')[0],
            tipo: 'teorica',
            descricao: `Aula Teórica - ${disciplina.nome}`,
            disciplina: disciplina.nome
          });
          encontrosGerados++;
        }
      }
      
      dataAtual.setDate(dataAtual.getDate() + 1);
      
      // Evitar loop infinito
      if (dataAtual.getFullYear() > dataInicio.getFullYear() + 3) {
        break;
      }
    }
    
    return eventos;
  }
  
  /**
   * Verifica se é dia útil (segunda a sexta)
   */
  private static isDiaUtil(data: Date): boolean {
    const diaSemana = data.getDay();
    return diaSemana >= 1 && diaSemana <= 5;
  }
  
  /**
   * Verifica se a data é feriado
   */
  private static isFeriado(data: Date, feriados: Feriado[]): boolean {
    const dataStr = data.toISOString().split('T')[0];
    return feriados.some(feriado => feriado.data === dataStr);
  }
  
  /**
   * Verifica se já existe evento na data
   */
  private static temConflito(data: Date, eventosExistentes: CalendarioEvento[]): boolean {
    const dataStr = data.toISOString().split('T')[0];
    return eventosExistentes.some(evento => evento.data === dataStr);
  }
  
  /**
   * Ajusta data para o primeiro dia útil
   */
  private static ajustarParaPrimeiroDiaUtil(data: Date, feriados: Feriado[]): Date {
    const novaData = new Date(data);
    
    while (!this.isDiaUtil(novaData) || this.isFeriado(novaData, feriados)) {
      novaData.setDate(novaData.getDate() + 1);
    }
    
    return novaData;
  }
  
  /**
   * Obtém o nome do dia da semana
   */
  private static getDiaSemana(data: Date): string {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[data.getDay()];
  }
}