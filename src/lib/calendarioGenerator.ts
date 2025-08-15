import { CalendarioGerado, CalendarioEvento, Aluno, Feriado, Trilha, Polo, Empresa, ResumoTrilha } from '../types';
import { GeradorModulos } from './calendario/geradorModulos';
import { GeradorTrilhas } from './calendario/geradorTrilhas';
import { GeradorPorDisciplina } from './calendario/geradorDisciplinas';
import { ValidadorCalendario } from './calendario/validacoes';

import { addDays, format } from 'date-fns';
import { GeradorFeriados } from './calendario/geradorFeriados';
import { GeradorPraticas } from './calendario/geradorPraticas';

export class CalendarioGenerator {
  private static feriados: Feriado[] = [];
  private static trilhas: Trilha[] = [];
  private static polos: Polo[] = [];
  private static empresas: Empresa[] = [];
  
  // Configurar dados estáticos
  static setFeriados(feriados: Feriado[]) {
    this.feriados = feriados;
  }
  
  static setTrilhas(trilhas: Trilha[]) {
    this.trilhas = trilhas;
  }
  
  static setPolos(polos: Polo[]) {
    this.polos = polos;
  }
  
  static setEmpresas(empresas: Empresa[]) {
    this.empresas = empresas;
  }
  
  // Getters para acessar os dados
  static getFeriados(): Feriado[] {
    return this.feriados;
  }
  
  static getTrilhas(): Trilha[] {
    return this.trilhas;
  }
  
  static getPolos(): Polo[] {
    return this.polos;
  }
  
  static getEmpresas(): Empresa[] {
    return this.empresas;
  }
  
  /**
   * Gera o calendário completo para um aluno
   */
  static gerarCalendario(
    aluno: Aluno,
    dataInicio: Date,
    dataFim: Date,
    feriasModo: '30' | '15+15',
    feriasInicio1: Date,
    feriasInicio2?: Date
  ): CalendarioGerado {
    console.log(`[CALENDARIO] Iniciando geração para ${aluno.nome}`);
    
    // Validar entradas
    const validacao = ValidadorCalendario.validarTodasAsRegras(
      dataInicio,
      dataFim,
      feriasModo,
      feriasInicio1,
      feriasInicio2,
      aluno.dia_aula_semana
    );

    if (!validacao.valido) {
      throw new Error(`Erro na validação: ${validacao.erros.join(', ')}`);
    }

    // Validar trilhas
    const errosTrilhas = GeradorTrilhas.validarTrilhas(this.trilhas, aluno.turma_id);
    if (errosTrilhas.length > 0) {
      console.warn(`[CALENDARIO] Avisos sobre trilhas: ${errosTrilhas.join(', ')}`);
    }

    // Obter polo do aluno
    const polo = this.polos.find(p => p.id === aluno.polo_id);
    if (!polo) {
      console.warn(`[CALENDARIO] Polo não encontrado para ID: ${aluno.polo_id}`);
    }

    // Obter empresa do aluno
    const empresa = this.empresas.find(e => e.id === aluno.empresa_id);
    if (!empresa) {
      console.warn(`[CALENDARIO] Empresa não encontrada para ID: ${aluno.empresa_id}`);
    }

    const eventos: CalendarioEvento[] = [];
    
    // Ajustar data de início se cair em fim de semana
    const dataInicioAjustada = this.ajustarDataInicio(dataInicio);
    console.log(`[CALENDARIO] Data ajustada: ${format(dataInicioAjustada, 'yyyy-MM-dd')}`);
    
    // Gerar eventos de férias
    const eventosFerias = this.gerarFerias(feriasModo, feriasInicio1, feriasInicio2);
    console.log(`[CALENDARIO] Gerados ${eventosFerias.length} eventos de férias`);

    // Obter disciplinas da turma do aluno
    const trilhasDaTurma = this.trilhas.filter(t => t.turma_id === aluno.turma_id);
    const disciplinasDaTurma = trilhasDaTurma.flatMap(t => t.disciplinas);
    
    console.log(`[CALENDARIO] Encontradas ${disciplinasDaTurma.length} disciplinas para a turma ${aluno.turma_id}`);

    // Gerar eventos baseados nas disciplinas configuradas
    const eventosAulas = GeradorPorDisciplina.gerarEventosPorDisciplinas(
      dataInicioAjustada,
      disciplinasDaTurma,
      aluno.dia_aula_semana,
      this.feriados,
      eventosFerias
    );
    console.log(`[CALENDARIO] Gerados ${eventosAulas.length} eventos de aulas baseados em disciplinas`);

    // Gerar dias práticos nos 4 dias úteis restantes por semana (respeitando feriados e férias)
    const eventosPraticas = GeradorPraticas.gerarDiasPraticos(
      dataInicioAjustada,
      dataFim,
      aluno.dia_aula_semana,
      this.feriados,
      [...eventosFerias, ...eventosAulas]
    );
    console.log(`[CALENDARIO] Gerados ${eventosPraticas.length} eventos de práticas`);

    // Combinar todos os eventos
    const todosEventos = [
      ...eventosFerias,
      ...eventosAulas,
      ...eventosPraticas
    ];

    // Gerar resumo das trilhas
    const resumoTrilhas = GeradorTrilhas.gerarResumoTrilhas(
      aluno,
      dataInicioAjustada,
      todosEventos,
      this.trilhas
    );

    // Selecionar feriados no período do calendário (multi-ano)
    const feriadosNoPeriodo = this.feriados.filter(feriado => {
      const dataF = new Date(feriado.data);
      return dataF >= dataInicioAjustada && dataF <= dataFim;
    });

    // Adicionar feriados por localização (priorizar cidade da empresa)
    if (polo) {
      const empresaInfo = empresa ? { cidade: empresa.cidade, uf: empresa.estado } : undefined;
      const feriadosEventos = GeradorFeriados.adicionarFeriados(
        dataInicioAjustada, 
        dataFim, 
        aluno, 
        polo, 
        feriadosNoPeriodo,
        empresaInfo
      );
      todosEventos.push(...feriadosEventos);
    }

    // Ordenar eventos por data
    todosEventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    const calendario: CalendarioGerado = {
      aluno,
      eventos: todosEventos,
      data_inicio: format(dataInicioAjustada, 'yyyy-MM-dd'),
      data_fim: format(dataFim, 'yyyy-MM-dd'),
      ferias_modo: feriasModo,
      ferias_inicio_1: format(feriasInicio1, 'yyyy-MM-dd'),
      ferias_fim_1: format(addDays(feriasInicio1, feriasModo === '30' ? 29 : 14), 'yyyy-MM-dd'),
      ferias_inicio_2: feriasInicio2 ? format(feriasInicio2, 'yyyy-MM-dd') : undefined,
      ferias_fim_2: feriasInicio2 ? format(addDays(feriasInicio2, 14), 'yyyy-MM-dd') : undefined,
      resumo_trilhas: resumoTrilhas
    };

    console.log(`[CALENDARIO] Calendário gerado com sucesso: ${todosEventos.length} eventos`);
    return calendario;
  }

  /**
   * Gera eventos de férias baseado no modo escolhido
   */
  private static gerarFerias(
    feriasModo: '30' | '15+15',
    feriasInicio1: Date,
    feriasInicio2?: Date
  ): CalendarioEvento[] {
    const eventos: CalendarioEvento[] = [];
    
    // Primeiro bloco de férias
    const diasPrimeiroBloco = feriasModo === '30' ? 30 : 15;
    for (let i = 0; i < diasPrimeiroBloco; i++) {
      const dataFerias = addDays(feriasInicio1, i);
      eventos.push({
        data: format(dataFerias, 'yyyy-MM-dd'),
        tipo: 'ferias',
        descricao: feriasModo === '30' ? 'Férias (30 dias)' : 'Férias (1º bloco - 15 dias)'
      });
    }
    
    // Segundo bloco de férias (apenas se modo 15+15)
    if (feriasModo === '15+15' && feriasInicio2) {
      for (let i = 0; i < 15; i++) {
        const dataFerias = addDays(feriasInicio2, i);
        eventos.push({
          data: format(dataFerias, 'yyyy-MM-dd'),
          tipo: 'ferias',
          descricao: 'Férias (2º bloco - 15 dias)'
        });
      }
    }
    
    return eventos;
  }

  /**
   * Ajusta a data de início para o próximo dia útil se cair em fim de semana
   */
  private static ajustarDataInicio(dataInicio: Date): Date {
    const data = new Date(dataInicio);
    const diaSemana = data.getDay();
    
    // Se cair no sábado (6), avançar para segunda (2 dias)
    if (diaSemana === 6) {
      data.setDate(data.getDate() + 2);
    }
    // Se cair no domingo (0), avançar para segunda (1 dia)
    else if (diaSemana === 0) {
      data.setDate(data.getDate() + 1);
    }
    
    return data;
  }
}