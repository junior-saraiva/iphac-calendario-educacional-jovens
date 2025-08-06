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

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 20;
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

    let isFirstPage = true;

    for (const mesAno of meses) {
      if (!isFirstPage) {
        this.pdf.addPage();
      }
      
      await this.criarPaginaMes(mesAno, eventosPorMes[mesAno], aluno, empresa, turma);
      isFirstPage = false;
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

  private adicionarCabecalho(aluno: any, empresa: string, turma: string): void {
    // Título principal
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('CALENDÁRIO ACADÊMICO', this.pageWidth / 2, 30, { align: 'center' });
    
    // Dados do aluno
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Aluno: ${aluno.nome}`, this.margin, 45);
    this.pdf.text(`Empresa: ${empresa}`, this.margin, 50);
    this.pdf.text(`Turma: ${turma}`, this.margin, 55);
    this.pdf.text(`Curso: ${aluno.curso}`, this.margin, 60);
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