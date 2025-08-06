import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CalendarioGerado, CalendarioEvento } from '@/types';
import { mockEmpresas, mockTurmas } from '@/data/mockData';
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
      author: 'Sistema de Gestão Acadêmica',
      creator: 'Sistema de Gestão Acadêmica',
    });

    // Obter dados do aluno
    const aluno = calendario.aluno;
    const empresa = mockEmpresas.find(e => e.id === aluno.empresa_id)?.nome || 'N/A';
    const turma = mockTurmas.find(t => t.id === aluno.turma_id)?.nome || 'N/A';

    // Agrupar eventos por mês
    const eventosPorMes = this.agruparEventosPorMes(calendario.eventos);
    const meses = Object.keys(eventosPorMes).sort();

    // Cabeçalho principal uma vez
    this.adicionarCabecalhoPrincipal(aluno, empresa, turma);
    
    // Título do calendário de disciplinas
    this.currentY += 10;
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFillColor(128, 0, 128); // Roxo
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text('Calendário das Disciplinas', this.pageWidth / 2, this.currentY + 6, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);
    this.currentY += 15;

    // Desenhar múltiplos meses por página (6 meses por página)
    const mesesPorPagina = 6;
    for (let i = 0; i < meses.length; i += mesesPorPagina) {
      if (i > 0) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }
      
      const mesesPagina = meses.slice(i, i + mesesPorPagina);
      await this.desenharMesesEmGrid(mesesPagina, eventosPorMes);
      
      // Se é a última página, adicionar legenda e resumo
      if (i + mesesPorPagina >= meses.length) {
        this.adicionarLegendaEResumo(calendario.eventos);
      }
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
    await this.desenharCalendario(dataRef, eventos);
    
    // Legenda
    this.adicionarLegenda();
    
    // Rodapé
    this.adicionarRodape();
  }

  private adicionarCabecalhoPrincipal(aluno: any, empresa: string, turma: string): void {
    // Cabeçalho da instituição
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Sistema de Gestão Acadêmica', this.pageWidth / 2, 20, { align: 'center' });
    
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('CNPJ: 00.000.000/0001-00', this.margin, 28);
    this.pdf.text('ENDEREÇO: Rua Example, 123 - Centro', this.margin, 32);
    this.pdf.text('CEP: 00000-000', this.margin, 36);
    this.pdf.text('CIDADE: Porto Alegre', this.pageWidth / 2, 28, { align: 'center' });
    this.pdf.text('UF: RS', this.pageWidth / 2, 32, { align: 'center' });
    this.pdf.text('FONE: 0000-0000', this.pageWidth - this.margin, 28, { align: 'right' });

    // Seção Aprendiz/Empresa
    this.currentY = 45;
    this.pdf.setFillColor(128, 0, 128); // Roxo
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 6, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Aprendiz / Empresa', this.pageWidth / 2, this.currentY + 4, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    // Dados do aprendiz
    this.currentY += 12;
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Aprendiz: ${aluno.id || '00000000'}   ${aluno.nome}`, this.margin, this.currentY);
    this.pdf.text(`00000   UF: RS`, this.pageWidth - this.margin - 40, this.currentY);
    
    this.currentY += 5;
    this.pdf.text(`Empresa: ${aluno.empresa_id || '0000000'}   ${empresa}`, this.margin, this.currentY);

    // Seção Centro Acadêmico
    this.currentY += 8;
    this.pdf.setFillColor(128, 0, 128);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 6, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Centro Acadêmico', this.pageWidth / 2, this.currentY + 4, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    // Dados acadêmicos
    this.currentY += 12;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Gestão: Gestão Educacional - Presencial Conectado`, this.margin, this.currentY);
    this.pdf.text(`Curso: ${aluno.curso}`, this.pageWidth - this.margin - 60, this.currentY);
    
    this.currentY += 5;
    this.pdf.text(`Matriz: Matriz de 4h - 2023`, this.margin, this.currentY);
    this.pdf.text(`De Início: 22/04/2025`, this.pageWidth / 2 - 20, this.currentY);
    this.pdf.text(`Dt Fim: 18/03/2027`, this.pageWidth - this.margin - 40, this.currentY);
    
    this.currentY += 5;
    this.pdf.text(`Turma: ${turma}`, this.margin, this.currentY);
    this.pdf.text(`CH: 1.960`, this.pageWidth - this.margin - 30, this.currentY);
  }

  private adicionarCabecalho(aluno: any, empresa: string, turma: string): void {
    // Método mantido para compatibilidade
    this.adicionarCabecalhoPrincipal(aluno, empresa, turma);
  }

  private async desenharCalendario(dataRef: Date, eventos: CalendarioEvento[]): Promise<void> {
    const inicioMes = startOfMonth(dataRef);
    const fimMes = endOfMonth(dataRef);
    const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
    
    const startY = 85;
    const cellWidth = (this.pageWidth - 2 * this.margin) / 7;
    const cellHeight = 15;
    
    // Cabeçalho dos dias da semana
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    
    diasSemana.forEach((dia, index) => {
      const x = this.margin + (index * cellWidth);
      this.pdf.rect(x, startY, cellWidth, cellHeight);
      this.pdf.text(dia, x + cellWidth/2, startY + 10, { align: 'center' });
    });

    // Criar mapa de eventos por data
    const eventosMap = new Map();
    eventos.forEach(evento => {
      const dateKey = format(evento.data, 'yyyy-MM-dd');
      eventosMap.set(dateKey, evento);
    });

    // Desenhar dias do mês
    let currentRow = 1;
    let currentY = startY + cellHeight;
    
    // Calcular linha inicial baseada no primeiro dia do mês
    const primeiroDiaSemana = getDay(inicioMes);
    let coluna = primeiroDiaSemana;
    
    diasDoMes.forEach((dia) => {
      const x = this.margin + (coluna * cellWidth);
      const y = currentY;
      
      // Desenhar célula
      this.pdf.rect(x, y, cellWidth, cellHeight);
      
      // Verificar se há evento neste dia
      const dateKey = format(dia, 'yyyy-MM-dd');
      const evento = eventosMap.get(dateKey);
      
      if (evento) {
        // Preencher com cor baseada no tipo
        const cor = this.getCorEvento(evento.tipo);
        this.pdf.setFillColor(cor.r, cor.g, cor.b);
        this.pdf.rect(x, y, cellWidth, cellHeight, 'F');
        this.pdf.rect(x, y, cellWidth, cellHeight); // Borda
      }
      
      // Número do dia
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(dia.getDate().toString(), x + 2, y + 10);
      
      // Avançar para próxima célula
      coluna++;
      if (coluna >= 7) {
        coluna = 0;
        currentRow++;
        currentY += cellHeight;
      }
    });
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

  private adicionarLegenda(): void {
    const startY = 200;
    const legendaItems = [
      { tipo: 'teorica', label: 'Aula Teórica', cor: { r: 34, g: 197, b: 94 } },
      { tipo: 'pratica', label: 'Dia Prático', cor: { r: 59, g: 130, b: 246 } },
      { tipo: 'feriado', label: 'Feriado', cor: { r: 239, g: 68, b: 68 } },
      { tipo: 'ferias', label: 'Férias', cor: { r: 251, g: 191, b: 36 } }
    ];

    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Legenda:', this.margin, startY);

    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    legendaItems.forEach((item, index) => {
      const y = startY + 10 + (index * 8);
      
      // Quadrado colorido
      this.pdf.setFillColor(item.cor.r, item.cor.g, item.cor.b);
      this.pdf.rect(this.margin, y - 3, 4, 4, 'F');
      
      // Texto
      this.pdf.text(item.label, this.margin + 8, y);
    });
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