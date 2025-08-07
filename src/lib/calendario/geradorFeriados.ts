import { Aluno, Feriado, CalendarioEvento, Polo } from '@/types';
import { format } from 'date-fns';

export class GeradorFeriados {
  /**
   * Adiciona feriados relevantes ao calendário baseado na localização do aluno
   */
  static adicionarFeriados(
    dataInicio: Date,
    dataFim: Date,
    aluno: Aluno,
    polo: Polo,
    todosFeriados: Feriado[],
    empresa?: { cidade: string; uf: string }
  ): CalendarioEvento[] {
    // Usar cidade da empresa se disponível, senão usar cidade do polo
    const cidadeFeriados = empresa?.cidade || polo.cidade;
    const ufFeriados = empresa?.uf || polo.uf;
    
    console.log(`[FERIADOS] Filtrando feriados para ${cidadeFeriados}/${ufFeriados} (empresa: ${empresa ? 'SIM' : 'NÃO'})`);
    
    // Filtrar feriados relevantes por localização e hierarquia
    const feriadosRelevantes = this.filtrarFeriadosPorLocalizacao(
      todosFeriados,
      cidadeFeriados,
      ufFeriados
    );

    // Filtrar feriados que estão no período do calendário
    const feriadosNoPeriodo = feriadosRelevantes.filter(feriado => {
      const dataFeriado = new Date(feriado.data);
      return dataFeriado >= dataInicio && dataFeriado <= dataFim;
    });

    console.log(`[FERIADOS] ${feriadosNoPeriodo.length} feriados aplicáveis encontrados`);

    // Converter para eventos do calendário
    return feriadosNoPeriodo.map(feriado => ({
      data: feriado.data,
      tipo: 'feriado' as const,
      descricao: `${feriado.descricao} (${this.getTipoFeriadoLabel(feriado.nivel)})`
    }));
  }

  /**
   * Filtra feriados por localização e aplica hierarquia
   */
  private static filtrarFeriadosPorLocalizacao(
    feriados: Feriado[],
    cidade: string,
    uf: string
  ): Feriado[] {
    const feriadosMap = new Map<string, Feriado>();

    // Processar em ordem de prioridade: nacional > estadual > municipal
    const niveisOrdenados = ['nacional', 'estadual', 'municipal', 'facultativo'];

    for (const nivel of niveisOrdenados) {
      const feriadosDoNivel = feriados.filter(f => f.nivel === nivel);

      for (const feriado of feriadosDoNivel) {
        // Verificar se feriado se aplica à localização
        if (this.feriadoSeAplica(feriado, cidade, uf)) {
          // Sempre manter o feriado de maior prioridade (nacional sobrepõe estadual, etc.)
          if (!feriadosMap.has(feriado.data) || 
              this.getNivelPrioridade(feriado.nivel) > 
              this.getNivelPrioridade(feriadosMap.get(feriado.data)!.nivel)) {
            feriadosMap.set(feriado.data, feriado);
          }
        }
      }
    }

    return Array.from(feriadosMap.values());
  }

  /**
   * Verifica se um feriado se aplica à localização específica
   */
  private static feriadoSeAplica(feriado: Feriado, cidade: string, uf: string): boolean {
    switch (feriado.nivel) {
      case 'nacional':
        return true; // Feriados nacionais se aplicam em todo lugar

      case 'estadual':
        // Verificar se o feriado é do estado correto
        return feriado.descricao.toLowerCase().includes(uf.toLowerCase()) ||
               feriado.id.toLowerCase().includes(uf.toLowerCase());

      case 'municipal':
        // Verificar se o feriado é da cidade correta
        return feriado.descricao.toLowerCase().includes(cidade.toLowerCase()) ||
               feriado.id.toLowerCase().includes(cidade.toLowerCase());

      case 'facultativo':
        // Feriados facultativos podem ser aplicados ou não (por enquanto incluir todos)
        return true;

      default:
        return false;
    }
  }

  /**
   * Retorna a prioridade numérica do nível do feriado
   */
  private static getNivelPrioridade(nivel: string): number {
    const prioridades = {
      'nacional': 4,
      'estadual': 3,
      'municipal': 2,
      'facultativo': 1
    };
    return prioridades[nivel as keyof typeof prioridades] || 0;
  }

  /**
   * Retorna o rótulo amigável do tipo de feriado
   */
  private static getTipoFeriadoLabel(nivel: string): string {
    const labels = {
      'nacional': 'Nacional',
      'estadual': 'Estadual',
      'municipal': 'Municipal',
      'facultativo': 'Facultativo'
    };
    return labels[nivel as keyof typeof labels] || 'Outros';
  }

  /**
   * Estatísticas dos feriados aplicados
   */
  static obterEstatisticasFeriados(eventos: CalendarioEvento[]): {
    total: number;
    porTipo: Record<string, number>;
  } {
    const feriadosEventos = eventos.filter(e => e.tipo === 'feriado');
    const porTipo: Record<string, number> = {};

    feriadosEventos.forEach(evento => {
      // Extrair tipo do feriado da descrição
      const match = evento.descricao.match(/\(([^)]+)\)$/);
      const tipo = match ? match[1] : 'Outros';
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    });

    return {
      total: feriadosEventos.length,
      porTipo
    };
  }
}