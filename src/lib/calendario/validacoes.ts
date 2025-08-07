import { addDays, isAfter, isBefore, differenceInDays } from 'date-fns';

export interface ValidacaoCalendario {
  valido: boolean;
  erros: string[];
}

export class ValidadorCalendario {
  static validarDatasBasicas(
    dataInicio: Date,
    dataFim: Date,
    feriasInicio: Date
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

    // Validar duração máxima do contrato (máximo 24 meses)
    if (duracaoMeses > 24) {
      erros.push('Duração do contrato não pode exceder 24 meses');
    }

    // Validar se férias estão dentro do período do contrato
    const feriasRangeInicio = feriasInicio;
    const feriasRangeFim = addDays(feriasInicio, 29);
    
    if (isBefore(feriasRangeInicio, dataInicio) || isAfter(feriasRangeFim, dataFim)) {
      erros.push('Período de férias deve estar dentro do período do contrato');
    }

    // Validar se férias não começam muito cedo (mínimo 90 dias após início)
    const minimoDiasParaFerias = 90;
    if (differenceInDays(feriasInicio, dataInicio) < minimoDiasParaFerias) {
      erros.push(`Férias devem iniciar pelo menos ${minimoDiasParaFerias} dias após o início do contrato`);
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
    feriasInicio: Date,
    diaAulaSemana: string
  ): ValidacaoCalendario {
    const validacoes = [
      this.validarDatasBasicas(dataInicio, dataFim, feriasInicio),
      this.validarDiaAulaSemana(diaAulaSemana)
    ];

    const todosErros = validacoes.flatMap(v => v.erros);
    
    return {
      valido: todosErros.length === 0,
      erros: todosErros
    };
  }
}