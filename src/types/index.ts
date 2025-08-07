export interface Polo {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  telefone: string;
  responsavel_nome: string;
  responsavel_email: string;
  logomarca?: string;
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  estado: string;
}

export interface Turma {
  id: string;
  nome: string;
  matriz: string;
  carga_horaria_total: number;
}

export interface Trilha {
  id: string;
  nome: string;
  codigo: string;
  tipo: 'integracao' | 'especifica' | 'profissional' | 'empregabilidade';
  turma_id: string;
  disciplinas: Disciplina[];
}

export interface Disciplina {
  id: string;
  trilha_id: string;
  nome: string;
  carga_horaria: number;
  dias_aula: string[];
}

export interface Aluno {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  turma_id: string;
  empresa_id: string;
  polo_id: string;
  curso: string;
  turno: string;
  dia_aula_semana: string; // Segunda, Terça, Quarta, Quinta, Sexta
}

export interface Feriado {
  id: string;
  data: string;
  descricao: string;
  nivel: 'nacional' | 'estadual' | 'municipal' | 'facultativo';
}

export interface CalendarioPDF {
  id: string;
  aluno_id: string;
  caminho_arquivo: string;
  data_geracao: string;
}

export interface CalendarioEvento {
  data: string;
  tipo: 'teorica' | 'pratica' | 'feriado' | 'ferias';
  descricao: string;
  disciplina?: string;
}

export interface ResumoTrilha {
  nome: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  carga_horaria: number;
}

export interface CalendarioGerado {
  aluno: Aluno;
  eventos: CalendarioEvento[];
  data_inicio: string;
  data_fim: string;
  ferias_inicio: string;
  ferias_fim: string;
  resumo_trilhas: ResumoTrilha[];
}