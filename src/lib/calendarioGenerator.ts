import { Aluno, CalendarioGerado, CalendarioEvento, Feriado, ResumoTrilha, Trilha, Polo, Empresa } from '@/types';
import { addDays, format, isSameDay, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ValidadorCalendario } from './calendario/validacoes';
import { GeradorModulos } from './calendario/geradorModulos';
import { GeradorTrilhas } from './calendario/geradorTrilhas';
import { GeradorFeriados } from './calendario/geradorFeriados';
import { CalendarioCache } from './calendario/cache';

export class CalendarioGenerator {
  private static feriados: Feriado[] = [];
  private static trilhas: Trilha[] = [];
  private static polos: Polo[] = [];
  private static empresas: Empresa[] = [];

  static setFeriados(feriados: Feriado[]) {
    this.feriados = feriados;
    CalendarioCache.clear(); // Limpar cache quando feriados mudam
  }

  static setTrilhas(trilhas: Trilha[]) {
    this.trilhas = trilhas;
    CalendarioCache.clear(); // Limpar cache quando trilhas mudam
  }

  static setPolos(polos: Polo[]) {
    this.polos = polos;
  }

  static setEmpresas(empresas: Empresa[]) {
    this.empresas = empresas;
  }

  static getFeriados(): Feriado[] {
    return this.feriados;
  }

  static getTrilhas(): Trilha[] {
    return this.trilhas;
  }

  static getPolos(): Polo[] {
    return this.polos;
  }

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
    
    // Gerar férias (30 dias corridos)
    const feriasEventos = this.gerarFerias(feriasInicio);
    eventos.push(...feriasEventos);

    // Gerar módulo 1 (10 dias úteis)
    const modulo1Eventos = GeradorModulos.gerarModulo1(dataInicioAjustada, this.feriados, eventos);
    eventos.push(...modulo1Eventos);

    // Calcular data de início dos demais módulos
    const ultimoDiaModulo1 = new Date(Math.max(...modulo1Eventos.map(e => new Date(e.data).getTime())));
    const inicioModulosRegulares = addDays(ultimoDiaModulo1, 1);

    // Gerar demais módulos (até a data fim)
    const modulosRegularesEventos = GeradorModulos.gerarModulosRegulares(
      inicioModulosRegulares,
      dataFim,
      aluno.dia_aula_semana,
      this.feriados,
      eventos
    );
    eventos.push(...modulosRegularesEventos);

    // Adicionar feriados por localização (priorizar cidade da empresa)
    if (polo) {
      const empresaInfo = empresa ? { cidade: empresa.cidade, uf: empresa.estado } : undefined;
      const feriadosEventos = GeradorFeriados.adicionarFeriados(
        dataInicioAjustada, 
        dataFim, 
        aluno, 
        polo, 
        this.feriados,
        empresaInfo
      );
      eventos.push(...feriadosEventos);
    }

    // Gerar resumo das trilhas baseado em dados reais
    const resumoTrilhas = GeradorTrilhas.gerarResumoTrilhas(aluno, dataInicioAjustada, eventos, this.trilhas);

    // Ordenar eventos por data
    eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    console.log(`[CALENDARIO] Geração concluída: ${eventos.length} eventos totais`);

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

  // Método removido - funcionalidade movida para GeradorModulos

  // Método removido - funcionalidade movida para GeradorModulos

  // Método removido - funcionalidade movida para GeradorFeriados

  // Método removido - funcionalidade movida para GeradorModulos

  // Método removido - funcionalidade movida para GeradorTrilhas
}