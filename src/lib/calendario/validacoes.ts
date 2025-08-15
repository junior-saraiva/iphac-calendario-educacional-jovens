import { addDays, isAfter, isBefore, differenceInDays } from 'date-fns';

export interface ValidacaoCalendario {
  valido: boolean;
  erros: string[];
}

export class ValidadorCalendario {
  static validarDatasBasicas(
    dataInicio: Date,
    dataFim: Date,
    feriasModo: '30' | '15+15',
    feriasInicio1: Date,
    feriasInicio2?: Date
  ): ValidacaoCalendario {
    const erros: string[] = [];

    // Validar se data de início é anterior à data fim
    if (isAfter(dataInicio, dataFim)) {
      erros.push('Data de início deve ser anterior à data fim');
    }

    // Validar duração mínima do contrato (mínimo 6 meses)
    const duracaoMeses = differenceInDays(dataFim, dataInicio) / 30;
    if (duracaoMeses < 6) {
      erros.push('Duração do contrato deve ser de pelo menos 6 meses');
    }

    // Validar duração máxima do contrato (máximo 23 meses conforme regra do projeto)
    if (duracaoMeses > 23.5) { // Tolerância de meio mês para variações de dias
      erros.push('Duração do contrato não pode exceder 23 meses');
    }

    // Validar se férias estão dentro do período do contrato
    const feriasRangeInicio1 = feriasInicio1;
    const diasFerias1 = feriasModo === '30' ? 29 : 14;
    const feriasRangeFim1 = addDays(feriasInicio1, diasFerias1);
    
    if (isBefore(feriasRangeInicio1, dataInicio) || isAfter(feriasRangeFim1, dataFim)) {
      erros.push('Primeiro período de férias deve estar dentro do período do contrato');
    }

    // Validar segundo período de férias se modo 15+15
    if (feriasModo === '15+15') {
      if (!feriasInicio2) {
        erros.push('Segunda data de férias é obrigatória no modo 15+15');
      } else {
        const feriasRangeInicio2 = feriasInicio2;
        const feriasRangeFim2 = addDays(feriasInicio2, 14);
        
        if (isBefore(feriasRangeInicio2, dataInicio) || isAfter(feriasRangeFim2, dataFim)) {
          erros.push('Segundo período de férias deve estar dentro do período do contrato');
        }

        // Validar que os períodos não se sobrepõem
        if (isBefore(feriasInicio2, feriasRangeFim1) && isAfter(addDays(feriasInicio2, 14), feriasInicio1)) {
          erros.push('Os períodos de férias não podem se sobrepor');
        }
      }
    }

    // Validar se férias não começam muito cedo (mínimo 90 dias após início)
    const minimoDiasParaFerias = 90;
    if (differenceInDays(feriasInicio1, dataInicio) < minimoDiasParaFerias) {
      erros.push(`Férias devem iniciar pelo menos ${minimoDiasParaFerias} dias após o início do contrato`);
    }

    // Validar meses permitidos para férias
    const mesesPermitidos = [12, 1, 6, 7]; // Dezembro, Janeiro, Junho, Julho
    const mesFerias1 = feriasInicio1.getMonth() + 1;
    if (!mesesPermitidos.includes(mesFerias1)) {
      erros.push('Primeiro período de férias deve iniciar em Dezembro, Janeiro, Junho ou Julho');
    }

    if (feriasModo === '15+15' && feriasInicio2) {
      const mesFerias2 = feriasInicio2.getMonth() + 1;
      if (!mesesPermitidos.includes(mesFerias2)) {
        erros.push('Segundo período de férias deve iniciar em Dezembro, Janeiro, Junho ou Julho');
      }
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }

  static validarDiaAulaSemana(diaAulaSemana: string): ValidacaoCalendario {
    const diasValidos = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const erros: string[] = [];

    if (!diasValidos.includes(diaAulaSemana)) {
      erros.push(`Dia da aula deve ser um dos seguintes: ${diasValidos.join(', ')}`);
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }

  static validarTodasAsRegras(
    dataInicio: Date,
    dataFim: Date,
    feriasModo: '30' | '15+15',
    feriasInicio1: Date,
    feriasInicio2: Date | undefined,
    diaAulaSemana: string
  ): ValidacaoCalendario {
    const validacoes = [
      this.validarDatasBasicas(dataInicio, dataFim, feriasModo, feriasInicio1, feriasInicio2),
      this.validarDiaAulaSemana(diaAulaSemana)
    ];

    const todosErros = validacoes.flatMap(v => v.erros);
    
    return {
      valido: todosErros.length === 0,
      erros: todosErros
    };
  }
}