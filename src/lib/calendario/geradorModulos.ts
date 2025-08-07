import { addDays, format, isWeekend } from 'date-fns';
import { CalendarioEvento, Feriado } from '@/types';

export class GeradorModulos {
  /**
   * Gera o Módulo 1 - Integração (10 dias úteis)
   * Regra: Apenas dias úteis contam, feriados estendem automaticamente o período
   */
  static gerarModulo1(
    dataInicio: Date,
    feriados: Feriado[],
    eventosExistentes: CalendarioEvento[]
  ): CalendarioEvento[] {
    const eventos: CalendarioEvento[] = [];
    let diasUteis = 0;
    let dataAtual = new Date(dataInicio);

    console.log(`[MODULO1] Iniciando geração a partir de ${format(dataInicio, 'yyyy-MM-dd')}`);

    while (diasUteis < 10) {
      const dataStr = format(dataAtual, 'yyyy-MM-dd');
      
      // Pular fins de semana
      if (isWeekend(dataAtual)) {
        dataAtual = addDays(dataAtual, 1);
        continue;
      }
      
      // Verificar conflitos com eventos existentes (férias)
      const temConflito = eventosExistentes.some(e => e.data === dataStr);
      if (temConflito) {
        console.log(`[MODULO1] Conflito detectado em ${dataStr}, pulando`);
        dataAtual = addDays(dataAtual, 1);
        continue;
      }
      
      // Verificar se é feriado
      const eFeriado = feriados.some(f => f.data === dataStr);
      if (eFeriado) {
        console.log(`[MODULO1] Feriado detectado em ${dataStr}, estendendo período`);
        dataAtual = addDays(dataAtual, 1);
        continue;
      }

      // Adicionar dia útil do módulo 1
      eventos.push({
        data: dataStr,
        tipo: 'teorica',
        descricao: 'Módulo 1 - Integração',
        disciplina: 'Trilha de Integração'
      });
      
      diasUteis++;
      console.log(`[MODULO1] Dia útil ${diasUteis}/10 adicionado: ${dataStr}`);
      dataAtual = addDays(dataAtual, 1);
    }

    console.log(`[MODULO1] Concluído com ${eventos.length} dias de aula`);
    return eventos;
  }

  /**
   * Gera os módulos regulares com distribuição de 1 dia teórico + 4 dias práticos por semana
   */
  static gerarModulosRegulares(
    dataInicio: Date,
    dataFim: Date,
    diaAulaSemana: string,
    feriados: Feriado[],
    eventosExistentes: CalendarioEvento[]
  ): CalendarioEvento[] {
    const eventos: CalendarioEvento[] = [];
    const diasSemana = {
      'Segunda': 1,
      'Terça': 2,
      'Quarta': 3,
      'Quinta': 4,
      'Sexta': 5
    };

    const diaTeoricoSemana = diasSemana[diaAulaSemana as keyof typeof diasSemana];
    if (!diaTeoricoSemana) {
      console.error(`[MODULOS] Dia da semana inválido: ${diaAulaSemana}`);
      return eventos;
    }

    console.log(`[MODULOS] Gerando de ${format(dataInicio, 'yyyy-MM-dd')} até ${format(dataFim, 'yyyy-MM-dd')}`);
    console.log(`[MODULOS] Dia teórico: ${diaAulaSemana} (${diaTeoricoSemana})`);

    let dataAtual = new Date(dataInicio);
    let diasPraticosNaSemana = 0;
    let ultimaSegundaFeira = this.getUltimaSegundaFeira(dataAtual);

    while (dataAtual <= dataFim) {
      const diaSemana = dataAtual.getDay();
      const dataStr = format(dataAtual, 'yyyy-MM-dd');

      // Reset contador de dias práticos se mudou de semana
      const segundaFeiraAtual = this.getUltimaSegundaFeira(dataAtual);
      if (segundaFeiraAtual.getTime() !== ultimaSegundaFeira.getTime()) {
        diasPraticosNaSemana = 0;
        ultimaSegundaFeira = segundaFeiraAtual;
      }

      // Verificar se não há conflitos
      const temConflito = eventosExistentes.some(e => e.data === dataStr);
      const eFeriado = feriados.some(f => f.data === dataStr);

      if (!temConflito && !eFeriado && !isWeekend(dataAtual)) {
        if (diaSemana === diaTeoricoSemana) {
          // Dia teórico
          eventos.push({
            data: dataStr,
            tipo: 'teorica',
            descricao: 'Aula Teórica',
            disciplina: this.getDisciplinaPorData(dataAtual)
          });
        } else if (diasPraticosNaSemana < 4) {
          // Dia prático (máximo 4 por semana)
          eventos.push({
            data: dataStr,
            tipo: 'pratica',
            descricao: 'Atividade Prática na Empresa'
          });
          diasPraticosNaSemana++;
        }
      }

      dataAtual = addDays(dataAtual, 1);
    }

    console.log(`[MODULOS] Gerados ${eventos.length} eventos regulares`);
    return eventos;
  }

  private static getUltimaSegundaFeira(data: Date): Date {
    const dia = data.getDay();
    const diasParaSegunda = dia === 0 ? 6 : dia - 1; // Domingo = 0, Segunda = 1
    return addDays(data, -diasParaSegunda);
  }

  private static getDisciplinaPorData(data: Date): string {
    const disciplinas = [
      'Comunicação e Expressão',
      'Ética e Cidadania',
      'Informática Básica',
      'Matemática Aplicada',
      'Administração Geral',
      'Gestão de Pessoas',
      'Legislação Trabalhista',
      'Qualidade e Produtividade'
    ];

    // Rotacionar disciplinas por semana
    const inicioAno = new Date(data.getFullYear(), 0, 1);
    const semanaDoAno = Math.floor((data.getTime() - inicioAno.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return disciplinas[semanaDoAno % disciplinas.length];
  }
}