import { CalendarioGerado, CalendarioEvento, Aluno, Feriado, Trilha, Polo, Empresa, ResumoTrilha } from '../types';
import { GeradorModulos } from './calendario/geradorModulos';
import { GeradorTrilhas } from './calendario/geradorTrilhas';
import { GeradorPorDisciplina } from './calendario/geradorDisciplinas';
import { ValidadorCalendario } from './calendario/validacoes';

import { addDays, format } from 'date-fns';
import { GeradorFeriados } from './calendario/geradorFeriados';

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
    feriasInicio: Date
  ): CalendarioGerado {
    console.log(`[CALENDARIO] Iniciando geração para ${aluno.nome}`);
    
    // Validar entradas
    const validacao = ValidadorCalendario.validarTodasAsRegras(
      dataInicio,
      dataFim,
      feriasInicio,
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
    const eventosFerias = this.gerarFerias(feriasInicio);
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

    // Combinar todos os eventos
    const todosEventos = [
      ...eventosFerias,
      ...eventosAulas
    ];

    // Gerar resumo das trilhas
    const resumoTrilhas = GeradorTrilhas.gerarResumoTrilhas(
      aluno,
      dataInicioAjustada,
      todosEventos,
      this.trilhas
    );

    // Filtrar feriados pelo ano da data de início
    const anoInicio = dataInicioAjustada.getFullYear();
    const feriadosDoAno = this.feriados.filter(feriado => {
      const anoFeriado = new Date(feriado.data).getFullYear();
      return anoFeriado === anoInicio;
    });

    // Adicionar feriados por localização (priorizar cidade da empresa)
    if (polo) {
      const empresaInfo = empresa ? { cidade: empresa.cidade, uf: empresa.estado } : undefined;
      const feriadosEventos = GeradorFeriados.adicionarFeriados(
        dataInicioAjustada, 
        dataFim, 
        aluno, 
        polo, 
        feriadosDoAno,
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
      ferias_inicio: format(feriasInicio, 'yyyy-MM-dd'),
      ferias_fim: format(addDays(feriasInicio, 29), 'yyyy-MM-dd'),
      resumo_trilhas: resumoTrilhas
    };

    console.log(`[CALENDARIO] Calendário gerado com sucesso: ${todosEventos.length} eventos`);
    return calendario;
  }

  /**
   * Gera eventos de férias
   */
  private static gerarFerias(feriasInicio: Date): CalendarioEvento[] {
    const eventos: CalendarioEvento[] = [];
    
    for (let i = 0; i < 30; i++) {
      const dataFerias = addDays(feriasInicio, i);
      eventos.push({
        data: format(dataFerias, 'yyyy-MM-dd'),
        tipo: 'ferias',
        descricao: 'Férias'
      });
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