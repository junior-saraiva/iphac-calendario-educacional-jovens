import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CalendarioGerado, CalendarioEvento } from '@/types';
import { mockEmpresas, mockTurmas, mockPolos } from '@/data/mockData';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class PDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 15;
    this.currentY = this.margin;
  }

  static async gerarPDF(calendario: CalendarioGerado, nomeAluno: string): Promise<void> {
    const generator = new PDFGenerator();
    await generator.criarPDF(calendario, nomeAluno);
  }

  private async criarPDF(calendario: CalendarioGerado, nomeAluno: string): Promise<void> {
    // Configurar metadados
    this.pdf.setProperties({
      title: `Calendário Acadêmico - ${nomeAluno}`,
      subject: 'Calendário de Trilha de Aprendizagem',
      author: 'IPHAC - Instituto de Promoção Humana e Ação Comunitária',
      creator: 'Sistema de Gestão Acadêmica IPHAC',
    });

    // Obter dados relacionados
    const aluno = calendario.aluno;
    const empresa = mockEmpresas.find(e => e.id === aluno.empresa_id);
    const polo = mockPolos.find(p => p.id === aluno.polo_id);
    
    // Cabeçalho institucional completo
    this.adicionarCabecalhoInstitucional(aluno, empresa, polo);
    
    // Legenda no topo
    this.adicionarLegendaTopo();
    
    // Resumo das trilhas
    this.adicionarResumoTrilhas(calendario.resumo_trilhas);
    
    // Agrupar eventos por mês
    const eventosPorMes = this.agruparEventosPorMes(calendario.eventos);
    const meses = Object.keys(eventosPorMes).sort();

    // Desenhar calendários mensais
    for (let i = 0; i < meses.length; i++) {
      if (this.currentY > 200 || i > 0) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }
      
      const mesAno = meses[i];
      const eventos = eventosPorMes[mesAno] || [];
      await this.desenharCalendarioMensal(mesAno, eventos);
    }

    // Download do PDF
    const fileName = `Calendario_${nomeAluno.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getFullYear()}.pdf`;
    this.pdf.save(fileName);
  }

  private agruparEventosPorMes(eventos: CalendarioEvento[]): Record<string, CalendarioEvento[]> {
    const grupos: Record<string, CalendarioEvento[]> = {};
    
    eventos.forEach(evento => {
      const mesAno = format(evento.data, 'yyyy-MM');
      if (!grupos[mesAno]) {
        grupos[mesAno] = [];
      }
      grupos[mesAno].push(evento);
    });
    
    return grupos;
  }

  private async criarPaginaMes(
    mesAno: string, 
    eventos: CalendarioEvento[], 
    aluno: any, 
    empresa: string, 
    turma: string
  ): Promise<void> {
    const [ano, mes] = mesAno.split('-').map(Number);
    const dataRef = new Date(ano, mes - 1, 1);
    
    // Cabeçalho
    this.adicionarCabecalho(aluno, empresa, turma);
    
    // Título do mês
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    const tituloMes = format(dataRef, 'MMMM yyyy', { locale: ptBR });
    const tituloCapitalizado = tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1);
    this.pdf.text(tituloCapitalizado, this.pageWidth / 2, 70, { align: 'center' });

    // Calendário
    await this.desenharCalendarioMensal(mesAno, eventos);
    
    // Legenda
    this.adicionarLegendaTopo();
    
    // Rodapé
    this.adicionarRodape();
  }

  private adicionarCabecalhoInstitucional(aluno: any, empresa: any, polo: any): void {
    // Logo e Nome da Instituição
    this.pdf.setFontSize(16);
    this.pdf.setFont('Montserrat', 'bold');
    this.pdf.text('IPHAC', this.pageWidth / 2, 25, { align: 'center' });
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('Open Sans', 'normal');
    this.pdf.text('Instituto de Promoção Humana e Ação Comunitária', this.pageWidth / 2, 32, { align: 'center' });

    // Dados da Unidade IPHAC
    this.currentY = 40;
    this.pdf.setFontSize(8);
    this.pdf.setFont('Open Sans', 'normal');
    
    if (polo) {
      this.pdf.text(`Unidade: ${polo.nome}`, this.margin, this.currentY);
      this.pdf.text(`CNPJ: ${polo.cnpj}`, this.pageWidth - this.margin - 50, this.currentY, { align: 'right' });
      
      this.currentY += 4;
      this.pdf.text(`${polo.endereco}`, this.margin, this.currentY);
      this.pdf.text(`${polo.cidade}/${polo.uf}`, this.pageWidth - this.margin - 30, this.currentY, { align: 'right' });
      
      this.currentY += 4;
      this.pdf.text(`Tel: ${polo.telefone}`, this.margin, this.currentY);
      this.pdf.text(`Responsável: ${polo.responsavel_nome}`, this.pageWidth - this.margin - 60, this.currentY, { align: 'right' });
    }

    // Seção do Aluno
    this.currentY += 10;
    this.pdf.setFillColor(92, 0, 119); // Roxo IPHAC
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 6, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(10);
    this.pdf.setFont('Montserrat', 'bold');
    this.pdf.text('DADOS DO ALUNO', this.pageWidth / 2, this.currentY + 4, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    this.currentY += 10;
    this.pdf.setFontSize(9);
    this.pdf.setFont('Open Sans', 'normal');
    this.pdf.text(`Nome: ${aluno.nome}`, this.margin, this.currentY);
    this.pdf.text(`RA: ${aluno.matricula}`, this.pageWidth - this.margin - 40, this.currentY, { align: 'right' });
    
    this.currentY += 5;
    this.pdf.text(`CPF: ${aluno.cpf}`, this.margin, this.currentY);
    this.pdf.text(`Curso: ${aluno.curso}`, this.pageWidth / 2, this.currentY, { align: 'center' });

    // Seção da Empresa
    this.currentY += 8;
    this.pdf.setFillColor(160, 0, 143); // Magenta IPHAC
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 6, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('Montserrat', 'bold');
    this.pdf.text('EMPRESA PARCEIRA', this.pageWidth / 2, this.currentY + 4, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    this.currentY += 10;
    this.pdf.setFont('Open Sans', 'normal');
    if (empresa) {
      this.pdf.text(`Empresa: ${empresa.nome}`, this.margin, this.currentY);
      this.pdf.text(`CNPJ: ${empresa.cnpj}`, this.pageWidth - this.margin - 50, this.currentY, { align: 'right' });
      
      this.currentY += 5;
      this.pdf.text(`Cidade: ${empresa.cidade}/${empresa.estado}`, this.margin, this.currentY);
    }

    this.currentY += 10;
  }

  private adicionarCabecalho(aluno: any, empresa: string, turma: string): void {
    // Método mantido para compatibilidade - redireciona para o novo método
    const empresaObj = mockEmpresas.find(e => e.id === aluno.empresa_id);
    const polo = mockPolos.find(p => p.id === aluno.polo_id);
    this.adicionarCabecalhoInstitucional(aluno, empresaObj, polo);
  }

  private adicionarResumoTrilhas(trilhas: any[]): void {
    this.pdf.setFillColor(0, 104, 55); // Verde IPHAC
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 6, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(10);
    this.pdf.setFont('Montserrat', 'bold');
    this.pdf.text('RESUMO DAS TRILHAS DE APRENDIZAGEM', this.pageWidth / 2, this.currentY + 4, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    this.currentY += 12;
    
    // Cabeçalho da tabela
    this.pdf.setFontSize(8);
    this.pdf.setFont('Montserrat', 'bold');
    this.pdf.setFillColor(230, 230, 230);
    
    const colWidths = [80, 40, 40, 30];
    const startX = this.margin;
    let currentX = startX;
    
    this.pdf.rect(currentX, this.currentY, colWidths[0], 8, 'F');
    this.pdf.text('Nome da Trilha', currentX + 2, this.currentY + 5);
    currentX += colWidths[0];
    
    this.pdf.rect(currentX, this.currentY, colWidths[1], 8, 'F');
    this.pdf.text('Data Início', currentX + 2, this.currentY + 5);
    currentX += colWidths[1];
    
    this.pdf.rect(currentX, this.currentY, colWidths[2], 8, 'F');
    this.pdf.text('Data Fim', currentX + 2, this.currentY + 5);
    currentX += colWidths[2];
    
    this.pdf.rect(currentX, this.currentY, colWidths[3], 8, 'F');
    this.pdf.text('C.H.', currentX + 2, this.currentY + 5);
    
    this.currentY += 8;
    
    // Dados das trilhas
    this.pdf.setFont('Open Sans', 'normal');
    trilhas.forEach((trilha, index) => {
      currentX = startX;
      const rowColor = index % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
      
      this.pdf.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
      this.pdf.rect(currentX, this.currentY, colWidths[0], 6, 'F');
      this.pdf.rect(currentX, this.currentY, colWidths[0], 6);
      this.pdf.text(trilha.nome, currentX + 2, this.currentY + 4);
      currentX += colWidths[0];
      
      this.pdf.rect(currentX, this.currentY, colWidths[1], 6, 'F');
      this.pdf.rect(currentX, this.currentY, colWidths[1], 6);
      this.pdf.text(trilha.data_inicio, currentX + 2, this.currentY + 4);
      currentX += colWidths[1];
      
      this.pdf.rect(currentX, this.currentY, colWidths[2], 6, 'F');
      this.pdf.rect(currentX, this.currentY, colWidths[2], 6);
      this.pdf.text(trilha.data_fim, currentX + 2, this.currentY + 4);
      currentX += colWidths[2];
      
      this.pdf.rect(currentX, this.currentY, colWidths[3], 6, 'F');
      this.pdf.rect(currentX, this.currentY, colWidths[3], 6);
      this.pdf.text(`${trilha.carga_horaria}h`, currentX + 2, this.currentY + 4);
      
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  private async desenharCalendarioMensal(mesAno: string, eventos: CalendarioEvento[]): Promise<void> {
    const [ano, mes] = mesAno.split('-').map(Number);
    const dataRef = new Date(ano, mes - 1, 1);
    
    // Título do mês
    this.pdf.setFontSize(14);
    this.pdf.setFont('Montserrat', 'bold');
    const tituloMes = format(dataRef, 'MMMM yyyy', { locale: ptBR });
    const tituloCapitalizado = tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1);
    this.pdf.text(tituloCapitalizado, this.pageWidth / 2, this.currentY + 8, { align: 'center' });

    this.currentY += 15;
    
    const inicioMes = startOfMonth(dataRef);
    const fimMes = endOfMonth(dataRef);
    const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
    
    const cellWidth = (this.pageWidth - 2 * this.margin) / 7;
    const cellHeight = 12;
    
    // Cabeçalho dos dias da semana (excluindo fins de semana)
    const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    this.pdf.setFontSize(9);
    this.pdf.setFont('Montserrat', 'bold');
    this.pdf.setFillColor(92, 0, 119);
    
    diasSemana.forEach((dia, index) => {
      const x = this.margin + (index * cellWidth * 1.4);
      this.pdf.rect(x, this.currentY, cellWidth * 1.4, cellHeight, 'F');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.text(dia, x + (cellWidth * 0.7), this.currentY + 8, { align: 'center' });
    });
    
    this.pdf.setTextColor(0, 0, 0);
    this.currentY += cellHeight;

    // Criar mapa de eventos por data (apenas dias úteis)
    const eventosMap = new Map();
    eventos.forEach(evento => {
      const data = new Date(evento.data);
      const diaSemana = getDay(data);
      // Só incluir se não for fim de semana (0=domingo, 6=sábado)
      if (diaSemana !== 0 && diaSemana !== 6) {
        const dateKey = format(evento.data, 'yyyy-MM-dd');
        eventosMap.set(dateKey, evento);
      }
    });

    // Desenhar apenas dias úteis
    const diasUteis = diasDoMes.filter(dia => {
      const diaSemana = getDay(dia);
      return diaSemana !== 0 && diaSemana !== 6; // Excluir sábado e domingo
    });
    
    let currentRow = 0;
    let currentCol = 0;
    const diasPorLinha = 5;
    
    diasUteis.forEach((dia, index) => {
      const x = this.margin + (currentCol * cellWidth * 1.4);
      const y = this.currentY + (currentRow * cellHeight);
      
      // Verificar se há evento neste dia
      const dateKey = format(dia, 'yyyy-MM-dd');
      const evento = eventosMap.get(dateKey);
      
      if (evento) {
        // Preencher com cor baseada no tipo
        const cor = this.getCorEvento(evento.tipo);
        this.pdf.setFillColor(cor.r, cor.g, cor.b);
        this.pdf.rect(x, y, cellWidth * 1.4, cellHeight, 'F');
      } else {
        this.pdf.setFillColor(255, 255, 255);
        this.pdf.rect(x, y, cellWidth * 1.4, cellHeight, 'F');
      }
      
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.rect(x, y, cellWidth * 1.4, cellHeight);
      
      // Número do dia
      this.pdf.setFontSize(8);
      this.pdf.setFont('Open Sans', 'normal');
      this.pdf.text(dia.getDate().toString(), x + 2, y + 8);
      
      // Descrição do evento (se houver)
      if (evento) {
        this.pdf.setFontSize(6);
        this.pdf.text(evento.descricao.substring(0, 15), x + 2, y + cellHeight - 2);
      }
      
      currentCol++;
      if (currentCol >= diasPorLinha) {
        currentCol = 0;
        currentRow++;
      }
    });
    
    this.currentY += (currentRow + 1) * cellHeight + 15;
  }

  private getCorEvento(tipo: CalendarioEvento['tipo']): { r: number; g: number; b: number } {
    switch (tipo) {
      case 'teorica':
        return { r: 34, g: 197, b: 94 }; // Verde
      case 'pratica':
        return { r: 59, g: 130, b: 246 }; // Azul
      case 'feriado':
        return { r: 239, g: 68, b: 68 }; // Vermelho
      case 'ferias':
        return { r: 251, g: 191, b: 36 }; // Amarelo
      default:
        return { r: 156, g: 163, b: 175 }; // Cinza
    }
  }

  private adicionarLegendaTopo(): void {
    this.pdf.setFillColor(0, 104, 55); // Verde IPHAC
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 6, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(10);
    this.pdf.setFont('Montserrat', 'bold');
    this.pdf.text('LEGENDA', this.pageWidth / 2, this.currentY + 4, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    this.currentY += 10;
    const legendaItems = [
      { tipo: 'teorica', label: 'Aula Teórica', cor: { r: 34, g: 197, b: 94 } },
      { tipo: 'pratica', label: 'Atividade Prática', cor: { r: 59, g: 130, b: 246 } },
      { tipo: 'feriado', label: 'Feriado', cor: { r: 239, g: 68, b: 68 } },
      { tipo: 'ferias', label: 'Férias', cor: { r: 251, g: 191, b: 36 } }
    ];

    this.pdf.setFontSize(8);
    this.pdf.setFont('Open Sans', 'normal');
    
    const itemsPerRow = 2;
    const columnWidth = (this.pageWidth - 2 * this.margin) / itemsPerRow;
    
    legendaItems.forEach((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = this.margin + (col * columnWidth);
      const y = this.currentY + (row * 6);
      
      // Quadrado colorido
      this.pdf.setFillColor(item.cor.r, item.cor.g, item.cor.b);
      this.pdf.rect(x, y - 2, 4, 4, 'F');
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.rect(x, y - 2, 4, 4);
      
      // Texto
      this.pdf.text(item.label, x + 8, y);
    });
    
    this.currentY += 15;
  }

  private async desenharMesesEmGrid(meses: string[], eventosPorMes: Record<string, CalendarioEvento[]>): Promise<void> {
    const colunas = 2;
    const linhas = 3;
    const larguraMes = (this.pageWidth - 2 * this.margin - 10) / colunas;
    const alturaMes = 65;
    
    for (let i = 0; i < meses.length && i < 6; i++) {
      const mesAno = meses[i];
      const [ano, mes] = mesAno.split('-').map(Number);
      const dataRef = new Date(ano, mes - 1, 1);
      const eventos = eventosPorMes[mesAno] || [];
      
      const coluna = i % colunas;
      const linha = Math.floor(i / colunas);
      
      const x = this.margin + (coluna * (larguraMes + 5));
      const y = this.currentY + (linha * (alturaMes + 10));
      
      await this.desenharMesCompacto(dataRef, eventos, x, y, larguraMes, alturaMes);
    }
    
    this.currentY += (linhas * (alturaMes + 10)) + 15;
  }

  private async desenharMesCompacto(dataRef: Date, eventos: CalendarioEvento[], x: number, y: number, largura: number, altura: number): Promise<void> {
    const inicioMes = startOfMonth(dataRef);
    const fimMes = endOfMonth(dataRef);
    const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
    
    // Título do mês
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFillColor(128, 0, 128); // Roxo
    this.pdf.rect(x, y, largura, 8, 'F');
    this.pdf.setTextColor(255, 255, 255);
    const tituloMes = format(dataRef, 'MMM/yy', { locale: ptBR }).toUpperCase();
    this.pdf.text(tituloMes, x + largura/2, y + 6, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    // Cabeçalho dos dias
    const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const cellWidth = largura / 7;
    const cellHeight = 7;
    
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'bold');
    
    diasSemana.forEach((dia, index) => {
      const cellX = x + (index * cellWidth);
      const cellY = y + 8;
      this.pdf.rect(cellX, cellY, cellWidth, cellHeight);
      this.pdf.text(dia, cellX + cellWidth/2, cellY + 5, { align: 'center' });
    });

    // Criar mapa de eventos
    const eventosMap = new Map();
    eventos.forEach(evento => {
      const dateKey = format(evento.data, 'yyyy-MM-dd');
      eventosMap.set(dateKey, evento);
    });

    // Desenhar dias
    let currentRow = 0;
    let currentCol = getDay(inicioMes);
    
    diasDoMes.forEach((dia) => {
      const cellX = x + (currentCol * cellWidth);
      const cellY = y + 15 + (currentRow * cellHeight);
      
      // Verificar se há evento
      const dateKey = format(dia, 'yyyy-MM-dd');
      const evento = eventosMap.get(dateKey);
      
      if (evento) {
        const cor = this.getCorEvento(evento.tipo);
        this.pdf.setFillColor(cor.r, cor.g, cor.b);
        this.pdf.rect(cellX, cellY, cellWidth, cellHeight, 'F');
      }
      
      this.pdf.rect(cellX, cellY, cellWidth, cellHeight);
      
      // Número do dia
      this.pdf.setFontSize(6);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(dia.getDate().toString(), cellX + 1, cellY + 5);
      
      currentCol++;
      if (currentCol >= 7) {
        currentCol = 0;
        currentRow++;
      }
    });
  }

  private adicionarLegendaEResumo(eventos: CalendarioEvento[]): void {
    // Espaço antes da legenda
    this.currentY += 10;
    
    // Legenda
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Legenda:', this.margin, this.currentY);
    
    const legendaItems = [
      { tipo: 'teorica', label: 'Aula Teórica', cor: { r: 34, g: 197, b: 94 } },
      { tipo: 'pratica', label: 'Dia Prático', cor: { r: 59, g: 130, b: 246 } },
      { tipo: 'feriado', label: 'Feriado', cor: { r: 239, g: 68, b: 68 } },
      { tipo: 'ferias', label: 'Férias', cor: { r: 251, g: 191, b: 36 } }
    ];
    
    this.currentY += 8;
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    
    legendaItems.forEach((item, index) => {
      const x = this.margin + (index * 40);
      
      // Quadrado colorido
      this.pdf.setFillColor(item.cor.r, item.cor.g, item.cor.b);
      this.pdf.rect(x, this.currentY - 2, 3, 3, 'F');
      
      // Texto
      this.pdf.text(item.label, x + 6, this.currentY);
    });
    
    // Resumo geral
    this.currentY += 15;
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Resumo Geral:', this.margin, this.currentY);
    
    this.currentY += 8;
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    
    const resumo = {
      teorica: eventos.filter(e => e.tipo === 'teorica').length,
      pratica: eventos.filter(e => e.tipo === 'pratica').length,
      feriado: eventos.filter(e => e.tipo === 'feriado').length,
      ferias: eventos.filter(e => e.tipo === 'ferias').length
    };
    
    this.pdf.text(`Total de Aulas Teóricas: ${resumo.teorica}`, this.margin, this.currentY);
    this.currentY += 5;
    this.pdf.text(`Total de Dias Práticos: ${resumo.pratica}`, this.margin, this.currentY);
    this.currentY += 5;
    this.pdf.text(`Total de Feriados: ${resumo.feriado}`, this.margin, this.currentY);
    this.currentY += 5;
    this.pdf.text(`Total de Dias de Férias: ${resumo.ferias}`, this.margin, this.currentY);
    this.currentY += 5;
    this.pdf.text(`Total de Eventos: ${eventos.length}`, this.margin, this.currentY);
    
    this.adicionarRodape();
  }

  private adicionarRodape(): void {
    const y = this.pageHeight - 15;
    
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    
    // Data de geração
    const dataGeracao = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    this.pdf.text(`Gerado em: ${dataGeracao}`, this.margin, y);
    
    // Número da página
    const pageNumber = this.pdf.getCurrentPageInfo().pageNumber;
    this.pdf.text(`Página ${pageNumber}`, this.pageWidth - this.margin, y, { align: 'right' });
  }
}