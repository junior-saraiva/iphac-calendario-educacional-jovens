import { Aluno, CalendarioGerado, CalendarioEvento, Feriado, ResumoTrilha } from '@/types';
import { mockFeriados, mockTrilhas } from '@/data/mockData';
import { addDays, format, isSameDay, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class CalendarioGenerator {
  private static feriados: Feriado[] = mockFeriados;

  static gerarCalendario(
    aluno: Aluno,
    dataInicio: Date,
    dataFim: Date,
    feriasInicio: Date
  ): CalendarioGerado {
    const eventos: CalendarioEvento[] = [];
    
    // Ajustar data de início se cair em fim de semana
    const dataInicioAjustada = this.ajustarDataInicio(dataInicio);
    
    // Gerar férias (30 dias corridos)
    const feriasEventos = this.gerarFerias(feriasInicio);
    eventos.push(...feriasEventos);

    // Gerar módulo 1 (10 dias úteis - sem fins de semana)
    const modulo1Eventos = this.gerarModulo1(dataInicioAjustada, eventos);
    eventos.push(...modulo1Eventos);

    // Calcular data de início dos demais módulos
    const ultimoDiaModulo1 = new Date(Math.max(...modulo1Eventos.map(e => new Date(e.data).getTime())));
    const inicioModulosRegulares = addDays(ultimoDiaModulo1, 1);

    // Gerar demais módulos (até a data fim)
    const modulosRegularesEventos = this.gerarModulosRegulares(
      inicioModulosRegulares,
      dataFim,
      aluno.dia_aula_semana,
      eventos
    );
    eventos.push(...modulosRegularesEventos);

    // Adicionar feriados
    const feriadosEventos = this.adicionarFeriados(dataInicioAjustada, dataFim);
    eventos.push(...feriadosEventos);

    // Gerar resumo das trilhas
    const resumoTrilhas = this.gerarResumoTrilhas(aluno, dataInicioAjustada, eventos);

    // Ordenar eventos por data
    eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    return {
      aluno,
      eventos,
      data_inicio: format(dataInicioAjustada, 'yyyy-MM-dd'),
      data_fim: format(dataFim, 'yyyy-MM-dd'),
      ferias_inicio: format(feriasInicio, 'yyyy-MM-dd'),
      ferias_fim: format(addDays(feriasInicio, 29), 'yyyy-MM-dd'),
      resumo_trilhas: resumoTrilhas
    };
  }

  private static gerarFerias(feriasInicio: Date): CalendarioEvento[] {
    const eventos: CalendarioEvento[] = [];
    
    for (let i = 0; i < 30; i++) {
      const data = addDays(feriasInicio, i);
      eventos.push({
        data: format(data, 'yyyy-MM-dd'),
        tipo: 'ferias',
        descricao: 'Férias'
      });
    }

    return eventos;
  }

  private static ajustarDataInicio(dataInicio: Date): Date {
    let dataAjustada = new Date(dataInicio);
    
    // Se cair no fim de semana, avançar para segunda-feira
    while (isWeekend(dataAjustada)) {
      dataAjustada = addDays(dataAjustada, 1);
    }
    
    return dataAjustada;
  }

  private static gerarModulo1(dataInicio: Date, eventosExistentes: CalendarioEvento[]): CalendarioEvento[] {
    const eventos: CalendarioEvento[] = [];
    let diasAdicionados = 0;
    let dataAtual = new Date(dataInicio);

    while (diasAdicionados < 10) {
      const dataStr = format(dataAtual, 'yyyy-MM-dd');
      
      // Pular fins de semana
      if (isWeekend(dataAtual)) {
        dataAtual = addDays(dataAtual, 1);
        continue;
      }
      
      // Verificar se não há conflito com férias ou outros eventos
      const temConflito = eventosExistentes.some(e => e.data === dataStr);
      
      if (!temConflito) {
        // Verificar se é feriado
        const eFeriado = this.feriados.some(f => f.data === dataStr);
        
        if (eFeriado) {
          // Se é feriado, não conta como dia do módulo, mas adiciona um dia extra no final
          dataAtual = addDays(dataAtual, 1);
          continue;
        }

        eventos.push({
          data: dataStr,
          tipo: 'teorica',
          descricao: 'Módulo 1 - Integração',
          disciplina: 'Trilha de Integração'
        });
        
        diasAdicionados++;
      }
      
      dataAtual = addDays(dataAtual, 1);
    }

    return eventos;
  }

  private static gerarModulosRegulares(
    dataInicio: Date,
    dataFim: Date,
    diaAulaSemana: string,
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
    if (!diaTeoricoSemana) return eventos;

    let dataAtual = new Date(dataInicio);

    while (dataAtual <= dataFim) {
      const diaSemana = dataAtual.getDay();
      const dataStr = format(dataAtual, 'yyyy-MM-dd');

      // Verificar se não há conflito com outros eventos
      const temConflito = eventosExistentes.some(e => e.data === dataStr);
      const eFeriado = this.feriados.some(f => f.data === dataStr);

      if (!temConflito && !eFeriado && !isWeekend(dataAtual)) {
        if (diaSemana === diaTeoricoSemana) {
          // Dia teórico
          eventos.push({
            data: dataStr,
            tipo: 'teorica',
            descricao: 'Aula Teórica',
            disciplina: this.getDisciplinaPorData(dataAtual)
          });
        } else {
          // Dia prático (segunda a sexta, exceto o dia teórico)
          eventos.push({
            data: dataStr,
            tipo: 'pratica',
            descricao: 'Atividade Prática na Empresa'
          });
        }
      }

      dataAtual = addDays(dataAtual, 1);
    }

    return eventos;
  }

  private static adicionarFeriados(dataInicio: Date, dataFim: Date): CalendarioEvento[] {
    return this.feriados
      .filter(feriado => {
        const dataFeriado = new Date(feriado.data);
        return dataFeriado >= dataInicio && dataFeriado <= dataFim;
      })
      .map(feriado => ({
        data: feriado.data,
        tipo: 'feriado' as const,
        descricao: feriado.descricao
      }));
  }

  private static getDisciplinaPorData(data: Date): string {
    // Simulação de rotação de disciplinas
    const disciplinas = [
      'Comunicação e Expressão',
      'Ética e Cidadania',
      'Informática Básica',
      'Matemática Aplicada',
      'Administração Geral',
      'Gestão de Pessoas'
    ];

    const semanaDoAno = Math.floor((data.getTime() - new Date(data.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return disciplinas[semanaDoAno % disciplinas.length];
  }

  private static gerarResumoTrilhas(aluno: Aluno, dataInicio: Date, eventos: CalendarioEvento[]): ResumoTrilha[] {
    const trilhasAluno = mockTrilhas.filter(t => t.turma_id === aluno.turma_id);
    const resumo: ResumoTrilha[] = [];

    // Módulo 1 - Integração
    const eventosModulo1 = eventos.filter(e => e.descricao === 'Módulo 1 - Integração');
    if (eventosModulo1.length > 0) {
      resumo.push({
        nome: 'Módulo 1 - Integração',
        tipo: 'integracao',
        data_inicio: eventosModulo1[0].data,
        data_fim: eventosModulo1[eventosModulo1.length - 1].data,
        carga_horaria: eventosModulo1.length * 8 // 8 horas por dia
      });
    }

    // Demais trilhas
    trilhasAluno.forEach(trilha => {
      if (trilha.tipo !== 'integracao') {
        const cargaHorariaTrilha = trilha.disciplinas.reduce((total, disc) => total + disc.carga_horaria, 0);
        
        resumo.push({
          nome: trilha.nome,
          tipo: trilha.tipo,
          data_inicio: format(addDays(dataInicio, 30), 'yyyy-MM-dd'), // Simulação
          data_fim: format(addDays(dataInicio, 300), 'yyyy-MM-dd'), // Simulação
          carga_horaria: cargaHorariaTrilha
        });
      }
    });

    return resumo;
  }
}