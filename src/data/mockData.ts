import { Polo, Empresa, Turma, Trilha, Disciplina, Aluno, Feriado } from '../types';

export const mockPolos: Polo[] = [
  {
    id: '1',
    nome: 'SENAI - Centro de Tecnologia Industrial',
    cnpj: '03.928.077/0001-59',
    endereco: 'Rua da Tecnologia, 123 - Centro',
    cidade: 'São Paulo',
    uf: 'SP',
    telefone: '(11) 3456-7890',
    responsavel_nome: 'Maria Silva Santos',
    responsavel_email: 'maria.santos@senai.br',
    logomarca: '/logo-senai.png'
  },
  {
    id: '2',
    nome: 'SENAC - Unidade Lapa',
    cnpj: '03.709.814/0001-48',
    endereco: 'Rua Clélia, 1040 - Lapa',
    cidade: 'São Paulo',
    uf: 'SP',
    telefone: '(11) 2845-6000',
    responsavel_nome: 'João Carlos Oliveira',
    responsavel_email: 'joao.oliveira@senac.br',
    logomarca: '/logo-senac.png'
  }
];

export const mockEmpresas: Empresa[] = [
  { id: '1', nome: 'TechCorp LTDA', cnpj: '12.345.678/0001-90', cidade: 'São Paulo', estado: 'SP' },
  { id: '2', nome: 'InnovaGroup S.A.', cnpj: '98.765.432/0001-10', cidade: 'Rio de Janeiro', estado: 'RJ' },
  { id: '3', nome: 'DigitalSoft ME', cnpj: '11.222.333/0001-44', cidade: 'Belo Horizonte', estado: 'MG' },
];

export const mockTurmas: Turma[] = [
  { id: '1', nome: 'Turma A - 2024', matriz: 'Informática', carga_horaria_total: 1200 },
  { id: '2', nome: 'Turma B - 2024', matriz: 'Administração', carga_horaria_total: 1000 },
  { id: '3', nome: 'Turma C - 2024', matriz: 'Logística', carga_horaria_total: 800 },
];

export const mockDisciplinas: Disciplina[] = [
  { id: '1', trilha_id: '1', nome: 'Introdução à Programação', carga_horaria: 80, dias_aula: [] },
  { id: '2', trilha_id: '1', nome: 'Lógica de Programação', carga_horaria: 60, dias_aula: [] },
  { id: '3', trilha_id: '2', nome: 'HTML e CSS', carga_horaria: 100, dias_aula: [] },
  { id: '4', trilha_id: '2', nome: 'JavaScript Básico', carga_horaria: 120, dias_aula: [] },
  { id: '5', trilha_id: '3', nome: 'React Framework', carga_horaria: 140, dias_aula: [] },
  { id: '6', trilha_id: '3', nome: 'Node.js Backend', carga_horaria: 160, dias_aula: [] },
  { id: '7', trilha_id: '4', nome: 'Preparação para Entrevistas', carga_horaria: 40, dias_aula: [] },
  { id: '8', trilha_id: '4', nome: 'Soft Skills', carga_horaria: 60, dias_aula: [] },
];

export const mockTrilhas: Trilha[] = [
  {
    id: '1',
    nome: 'Trilha Introdutória',
    codigo: 'TI001',
    tipo: 'integracao',
    turma_id: '1',
    disciplinas: mockDisciplinas.filter(d => d.trilha_id === '1')
  },
  {
    id: '2',
    nome: 'Trilha Específica Web',
    codigo: 'TE001',
    tipo: 'especifica',
    turma_id: '1',
    disciplinas: mockDisciplinas.filter(d => d.trilha_id === '2')
  },
  {
    id: '3',
    nome: 'Trilha Profissional Full Stack',
    codigo: 'TP001',
    tipo: 'profissional',
    turma_id: '1',
    disciplinas: mockDisciplinas.filter(d => d.trilha_id === '3')
  },
  {
    id: '4',
    nome: 'Trilha Empregabilidade',
    codigo: 'TE001',
    tipo: 'empregabilidade',
    turma_id: '1',
    disciplinas: mockDisciplinas.filter(d => d.trilha_id === '4')
  },
];

export const mockAlunos: Aluno[] = [
  {
    id: '1',
    nome: 'João Silva Santos',
    cpf: '123.456.789-00',
    matricula: 'MAT001',
    turma_id: '1',
    empresa_id: '1',
    polo_id: '1',
    curso: 'Jovem Aprendiz - Informática',
    turno: 'Manhã',
    dia_aula_semana: 'Quarta'
  },
  {
    id: '2',
    nome: 'María Oliveira Costa',
    cpf: '987.654.321-00',
    matricula: 'MAT002',
    turma_id: '1',
    empresa_id: '2',
    polo_id: '1',
    curso: 'Jovem Aprendiz - Informática',
    turno: 'Tarde',
    dia_aula_semana: 'Terça'
  },
  {
    id: '3',
    nome: 'Pedro Rodrigues Lima',
    cpf: '456.789.123-00',
    matricula: 'MAT003',
    turma_id: '2',
    empresa_id: '3',
    polo_id: '2',
    curso: 'Jovem Aprendiz - Administração',
    turno: 'Manhã',
    dia_aula_semana: 'Quinta'
  },
  {
    id: '4',
    nome: 'José da Silva',
    cpf: '789.123.456-00',
    matricula: 'MAT004',
    turma_id: '2',
    empresa_id: '1',
    polo_id: '2',
    curso: 'Jovem Aprendiz - Administração',
    turno: 'Tarde',
    dia_aula_semana: 'Segunda'
  },
  {
    id: '5',
    nome: 'Ana Luíza',
    cpf: '321.654.987-00',
    matricula: 'MAT005',
    turma_id: '1',
    empresa_id: '2',
    polo_id: '1',
    curso: 'Jovem Aprendiz - Informática',
    turno: 'Manhã',
    dia_aula_semana: 'Sexta'
  },
  {
    id: '6',
    nome: 'André Luís',
    cpf: '654.987.321-00',
    matricula: 'MAT006',
    turma_id: '2',
    empresa_id: '3',
    polo_id: '2',
    curso: 'Jovem Aprendiz - Administração',
    turno: 'Tarde',
    dia_aula_semana: 'Segunda'
  }
];

// Importar feriados reais de 2025
import { feriadosReaisCombinados2025 } from './index_feriados_reais_combinados_2025';

export const mockFeriados: Feriado[] = feriadosReaisCombinados2025;