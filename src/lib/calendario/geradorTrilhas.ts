import { addDays, format, addWeeks } from 'date-fns';
import { Aluno, Trilha, CalendarioEvento, ResumoTrilha } from '@/types';

export class GeradorTrilhas {
  /**
   * Gera resumo realista das trilhas baseado em dados reais
   */
  static gerarResumoTrilhas(
    aluno: Aluno,
    dataInicio: Date,
    eventos: CalendarioEvento[],
    trilhas: Trilha[]
  ): ResumoTrilha[] {
    const trilhasAluno = trilhas.filter(t => t.turma_id === aluno.turma_id);
    const resumo: ResumoTrilha[] = [];

    console.log(`[TRILHAS] Gerando resumo para ${trilhasAluno.length} trilhas`);

    // Módulo 1 - Integração (calculado a partir dos eventos reais)
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

    // Calcular data de início das trilhas após o módulo 1
    const ultimoDiaModulo1 = eventosModulo1.length > 0 
      ? new Date(eventosModulo1[eventosModulo1.length - 1].data)
      : dataInicio;
    
    let dataInicioTrilha = addDays(ultimoDiaModulo1, 7); // 1 semana de intervalo

    // Processar trilhas em ordem de prioridade
    const ordemTrilhas = ['especifica', 'profissional', 'empregabilidade'];
    
    for (const tipoTrilha of ordemTrilhas) {
      const trilhasDoTipo = trilhasAluno.filter(t => t.tipo === tipoTrilha);
      
      for (const trilha of trilhasDoTipo) {
        const cargaHorariaTrilha = trilha.disciplinas.reduce(
          (total, disc) => total + disc.carga_horaria, 
          0
        );

        if (cargaHorariaTrilha > 0) {
          // Calcular duração baseada na carga horária
          // Assumindo 1 aula teórica de 8h por semana + atividades práticas
          const semanasNecessarias = Math.ceil(cargaHorariaTrilha / 32); // 32h por semana
          const dataFimTrilha = addWeeks(dataInicioTrilha, semanasNecessarias);

          resumo.push({
            nome: trilha.nome,
            tipo: trilha.tipo,
            data_inicio: format(dataInicioTrilha, 'yyyy-MM-dd'),
            data_fim: format(dataFimTrilha, 'yyyy-MM-dd'),
            carga_horaria: cargaHorariaTrilha
          });

          console.log(`[TRILHAS] ${trilha.nome}: ${cargaHorariaTrilha}h, ${semanasNecessarias} semanas`);

          // Próxima trilha inicia 1 semana após o fim desta
          dataInicioTrilha = addWeeks(dataFimTrilha, 1);
        }
      }
    }

    console.log(`[TRILHAS] Resumo gerado com ${resumo.length} trilhas`);
    return resumo;
  }

  /**
   * Valida se as trilhas estão adequadamente configuradas
   */
  static validarTrilhas(trilhas: Trilha[], turmaId: string): string[] {
    const erros: string[] = [];
    const trilhasAluno = trilhas.filter(t => t.turma_id === turmaId);

    if (trilhasAluno.length === 0) {
      erros.push('Nenhuma trilha encontrada para a turma do aluno');
      return erros;
    }

    // Verificar se existe trilha de integração
    const temIntegracao = trilhasAluno.some(t => t.tipo === 'integracao');
    if (!temIntegracao) {
      erros.push('Trilha de integração não encontrada para a turma');
    }

    // Verificar se existe trilha específica
    const temEspecifica = trilhasAluno.some(t => t.tipo === 'especifica');
    if (!temEspecifica) {
      erros.push('Trilha específica não encontrada para a turma');
    }

    // Verificar se trilhas têm disciplinas
    trilhasAluno.forEach(trilha => {
      if (!trilha.disciplinas || trilha.disciplinas.length === 0) {
        erros.push(`Trilha "${trilha.nome}" não possui disciplinas cadastradas`);
      }

      const cargaTotal = trilha.disciplinas.reduce((total, d) => total + d.carga_horaria, 0);
      if (cargaTotal === 0) {
        erros.push(`Trilha "${trilha.nome}" possui carga horária zero`);
      }
    });

    return erros;
  }
}