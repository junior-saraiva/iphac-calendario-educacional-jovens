import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CalendarioGerado, CalendarioEvento } from '@/types';
import { mockEmpresas, mockTurmas, mockPolos } from '@/data/mockData';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoIphac from '@/assets/logo-iphac.png';

export class PDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private logoLoaded: boolean = false;
  private logoData: string | null = null;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 15;
    this.currentY = this.margin;
    this.configurarFontes();
  }

  private configurarFontes(): void {
    // Adicionar fontes personalizadas (simulação - jsPDF usa fontes padrão)
    // Em produção, seria necessário carregar fontes TTF customizadas
    try {
      this.pdf.addFont('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap', 'Montserrat', 'normal');
      this.pdf.addFont('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap', 'Open Sans', 'normal');
    } catch (error) {
      console.warn('Fontes customizadas não disponíveis, usando fontes padrão');
    }
  }

  private async carregarLogo(): Promise<void> {
    if (this.logoLoaded) return;
    
    try {
      const response = await fetch(logoIphac);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.logoData = reader.result as string;
          this.logoLoaded = true;
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Erro ao carregar logo:', error);
      this.logoLoaded = true;
    }
  }

  static async gerarPDF(calendario: CalendarioGerado, nomeAluno: string): Promise<void> {
    const generator = new PDFGenerator();
    await generator.criarPDF(calendario, nomeAluno);
  }

  private async criarPDF(calendario: CalendarioGerado, nomeAluno: string): Promise<void> {
    // Carregar logo primeiro
    await this.carregarLogo();
    
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
    await this.adicionarCabecalhoInstitucional(aluno, empresa, polo);
    
    // Legenda 
    this.adicionarLegenda();
    
    // Resumo das trilhas
    this.adicionarResumoTrilhas(calendario.resumo_trilhas);
    
    // Agrupar eventos por mês
    const eventosPorMes = this.agruparEventosPorMes(calendario.eventos);
    const meses = Object.keys(eventosPorMes).sort();

    // Desenhar 6 meses por página em grid 2x3
    let mesIndex = 0;
    while (mesIndex < meses.length) {
      if (mesIndex > 0) {
        this.pdf.addPage();
        this.currentY = this.margin;
        await this.adicionarCabecalhoCompacto(aluno, empresa, polo);
      }
      
      const mesesPagina = meses.slice(mesIndex, mesIndex + 6);
      const eventosPagina: Record<string, CalendarioEvento[]> = {};
      mesesPagina.forEach(mes => {
        eventosPagina[mes] = eventosPorMes[mes] || [];
      });
      
      await this.desenharMesesEmGrid(mesesPagina, eventosPagina);
      this.adicionarRodape();
      
      mesIndex += 6;
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

  private async adicionarCabecalhoInstitucional(aluno: any, empresa: any, polo: any): Promise<void> {
    // Logo IPHAC
    if (this.logoData) {
      try {
        this.pdf.addImage(this.logoData, 'PNG', this.margin, 10, 30, 15);
      } catch (error) {
        console.warn('Erro ao adicionar logo:', error);
      }
    }
    
    // Nome da Instituição (ao lado da logo)
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(92, 0, 119); // Roxo IPHAC
    this.pdf.text('IPHAC', this.margin + 35, 20);
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Instituto de Promoção Humana e Ação Comunitária', this.margin + 35, 26);

    // Informações da Unidade (lado direito)
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    
    if (polo) {
      this.pdf.text(`Unidade: ${polo.nome}`, this.pageWidth - this.margin - 70, 15, { align: 'left' });
      this.pdf.text(`CNPJ: ${polo.cnpj}`, this.pageWidth - this.margin - 70, 19, { align: 'left' });
      this.pdf.text(`${polo.endereco}`, this.pageWidth - this.margin - 70, 23, { align: 'left' });
      this.pdf.text(`${polo.cidade}/${polo.uf}`, this.pageWidth - this.margin - 70, 27, { align: 'left' });
    }

    this.currentY = 35;

    // Seção do Aluno - Design mais limpo
    this.pdf.setFillColor(230, 230, 230);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 18, 'F');
    this.pdf.setDrawColor(92, 0, 119);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 18);

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(92, 0, 119);
    this.pdf.text('DADOS DO ALUNO', this.margin + 2, this.currentY + 6);

    this.currentY += 8;
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(`Nome: ${aluno.nome}`, this.margin + 2, this.currentY + 3);
    this.pdf.text(`RA: ${aluno.matricula}`, this.pageWidth - this.margin - 40, this.currentY + 3, { align: 'right' });
    
    this.currentY += 4;
    this.pdf.text(`CPF: ${aluno.cpf}`, this.margin + 2, this.currentY + 3);
    this.pdf.text(`Curso: ${aluno.curso}`, this.pageWidth / 2 + 10, this.currentY + 3, { align: 'left' });

    this.currentY += 10;

    // Seção da Empresa - Design consistente
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 14, 'F');
    this.pdf.setDrawColor(160, 0, 143);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 14);

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(160, 0, 143);
    this.pdf.text('EMPRESA PARCEIRA', this.margin + 2, this.currentY + 6);

    this.currentY += 8;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    if (empresa) {
      this.pdf.text(`Empresa: ${empresa.nome}`, this.margin + 2, this.currentY + 3);
      this.pdf.text(`CNPJ: ${empresa.cnpj}`, this.pageWidth - this.margin - 50, this.currentY + 3, { align: 'right' });
    }

    this.currentY += 12;
  }

  private async adicionarCabecalhoCompacto(aluno: any, empresa: any, polo: any): Promise<void> {
    // Cabeçalho compacto para páginas subsequentes
    if (this.logoData) {
      try {
        this.pdf.addImage(this.logoData, 'PNG', this.margin, 10, 20, 10);
      } catch (error) {
        console.warn('Erro ao adicionar logo:', error);
      }
    }

    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(92, 0, 119);
    this.pdf.text('IPHAC', this.margin + 25, 18);
    
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(`Aluno: ${aluno.nome}`, this.pageWidth / 2, 15, { align: 'center' });
    this.pdf.text(`Curso: ${aluno.curso}`, this.pageWidth / 2, 19, { align: 'center' });

    this.currentY = 30;
  }

  private adicionarResumoTrilhas(trilhas: any[]): void {
    this.pdf.setFillColor(0, 104, 55); // Verde IPHAC
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 6, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('RESUMO DAS TRILHAS DE APRENDIZAGEM', this.pageWidth / 2, this.currentY + 4, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    this.currentY += 12;
    
    // Cabeçalho da tabela
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
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
    this.pdf.setFont('helvetica', 'normal');
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

  private adicionarLegenda(): void {
    this.pdf.setFillColor(92, 0, 119); // Roxo IPHAC
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('LEGENDA', this.pageWidth / 2, this.currentY + 5.5, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    this.currentY += 12;
    const legendaItems = [
      { tipo: 'teorica', label: 'Aula Teórica', cor: { r: 144, g: 238, b: 144 } },
      { tipo: 'pratica', label: 'Atividade Prática', cor: { r: 173, g: 216, b: 230 } },
      { tipo: 'feriado', label: 'Feriado', cor: { r: 255, g: 182, b: 193 } },
      { tipo: 'ferias', label: 'Férias', cor: { r: 255, g: 255, b: 224 } }
    ];

    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    const itemsPerRow = 4;
    const columnWidth = (this.pageWidth - 2 * this.margin) / itemsPerRow;
    
    legendaItems.forEach((item, index) => {
      const x = this.margin + (index * columnWidth);
      const y = this.currentY;
      
      // Quadrado colorido
      this.pdf.setFillColor(item.cor.r, item.cor.g, item.cor.b);
      this.pdf.rect(x, y - 2, 5, 5, 'F');
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.2);
      this.pdf.rect(x, y - 2, 5, 5);
      
      // Texto
      this.pdf.text(item.label, x + 8, y + 1);
    });
    
    this.currentY += 12;
  }

  private async desenharMesesEmGrid(meses: string[], eventosPorMes: Record<string, CalendarioEvento[]>): Promise<void> {
    const colunas = 2;
    const linhas = 3;
    const espacamentoH = 5;
    const espacamentoV = 8;
    const larguraMes = (this.pageWidth - 2 * this.margin - espacamentoH) / colunas;
    const alturaMes = 55;
    
    for (let i = 0; i < meses.length && i < 6; i++) {
      const mesAno = meses[i];
      const [ano, mes] = mesAno.split('-').map(Number);
      const dataRef = new Date(ano, mes - 1, 1);
      const eventos = eventosPorMes[mesAno] || [];
      
      const coluna = i % colunas;
      const linha = Math.floor(i / colunas);
      
      const x = this.margin + (coluna * (larguraMes + espacamentoH));
      const y = this.currentY + (linha * (alturaMes + espacamentoV));
      
      await this.desenharMesCompacto(dataRef, eventos, x, y, larguraMes, alturaMes);
    }
    
    this.currentY += (linhas * (alturaMes + espacamentoV)) + 10;
  }

  private async desenharMesCompacto(dataRef: Date, eventos: CalendarioEvento[], x: number, y: number, largura: number, altura: number): Promise<void> {
    const inicioMes = startOfMonth(dataRef);
    const fimMes = endOfMonth(dataRef);
    const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
    
    // Filtrar apenas dias úteis (segunda a sexta)
    const diasUteis = diasDoMes.filter(dia => {
      const diaSemana = getDay(dia);
      return diaSemana !== 0 && diaSemana !== 6; // Excluir domingo(0) e sábado(6)
    });
    
    // Título do mês
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFillColor(92, 0, 119); // Roxo IPHAC
    this.pdf.rect(x, y, largura, 9, 'F');
    this.pdf.setTextColor(255, 255, 255);
    const tituloMes = format(dataRef, 'MMMM/yyyy', { locale: ptBR });
    const tituloCapitalizado = tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1);
    this.pdf.text(tituloCapitalizado, x + largura/2, y + 6.5, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);

    // Cabeçalho dos dias úteis apenas
    const diasSemana = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
    const cellWidth = largura / 5; // 5 colunas para dias úteis
    const cellHeight = 6;
    
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFillColor(230, 230, 230);
    
    diasSemana.forEach((dia, index) => {
      const cellX = x + (index * cellWidth);
      const cellY = y + 9;
      this.pdf.rect(cellX, cellY, cellWidth, cellHeight, 'F');
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.2);
      this.pdf.rect(cellX, cellY, cellWidth, cellHeight);
      this.pdf.text(dia, cellX + cellWidth/2, cellY + 4.5, { align: 'center' });
    });

    // Criar mapa de eventos por data
    const eventosMap = new Map();
    eventos.forEach(evento => {
      const data = new Date(evento.data);
      const diaSemana = getDay(data);
      // Só incluir eventos de dias úteis
      if (diaSemana !== 0 && diaSemana !== 6) {
        const dateKey = format(evento.data, 'yyyy-MM-dd');
        eventosMap.set(dateKey, evento);
      }
    });

    // Desenhar grid de dias úteis
    let currentRow = 0;
    let currentCol = 0;
    const diasPorLinha = 5;
    
    diasUteis.forEach((dia, index) => {
      const cellX = x + (currentCol * cellWidth);
      const cellY = y + 15 + (currentRow * cellHeight);
      
      // Verificar se há evento neste dia
      const dateKey = format(dia, 'yyyy-MM-dd');
      const evento = eventosMap.get(dateKey);
      
      if (evento) {
        // Preencher com cor baseada no tipo
        const cor = this.getCorEventoSuave(evento.tipo);
        this.pdf.setFillColor(cor.r, cor.g, cor.b);
        this.pdf.rect(cellX, cellY, cellWidth, cellHeight, 'F');
      } else {
        this.pdf.setFillColor(255, 255, 255);
        this.pdf.rect(cellX, cellY, cellWidth, cellHeight, 'F');
      }
      
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.setLineWidth(0.1);
      this.pdf.rect(cellX, cellY, cellWidth, cellHeight);
      
      // Número do dia
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(dia.getDate().toString(), cellX + 1, cellY + 4);
      
      // Indicador de evento (se houver)
      if (evento) {
        this.pdf.setFontSize(5);
        const abrev = this.getAbreviacaoEvento(evento.tipo);
        this.pdf.text(abrev, cellX + cellWidth - 8, cellY + cellHeight - 1);
      }
      
      currentCol++;
      if (currentCol >= diasPorLinha) {
        currentCol = 0;
        currentRow++;
      }
    });
  }

  private getCorEventoSuave(tipo: CalendarioEvento['tipo']): { r: number; g: number; b: number } {
    switch (tipo) {
      case 'teorica':
        return { r: 144, g: 238, b: 144 }; // Verde claro
      case 'pratica':
        return { r: 173, g: 216, b: 230 }; // Azul claro
      case 'feriado':
        return { r: 255, g: 182, b: 193 }; // Rosa claro
      case 'ferias':
        return { r: 255, g: 255, b: 224 }; // Amarelo claro
      default:
        return { r: 245, g: 245, b: 245 }; // Cinza claro
    }
  }

  private getAbreviacaoEvento(tipo: CalendarioEvento['tipo']): string {
    switch (tipo) {
      case 'teorica':
        return 'T';
      case 'pratica':
        return 'P';
      case 'feriado':
        return 'F';
      case 'ferias':
        return 'V';
      default:
        return '';
    }
  }

  private adicionarRodape(): void {
    const rodapeY = this.pageHeight - 15;
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setTextColor(128, 128, 128);
    
    const dataGeracao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    this.pdf.text(`Gerado em: ${dataGeracao}`, this.margin, rodapeY);
    
    const numeroPagina = (this.pdf as any).internal.getNumberOfPages();
    this.pdf.text(`Pág. ${numeroPagina}`, this.pageWidth - this.margin - 15, rodapeY);
    
    // Linha sutil no rodapé
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.2);
    this.pdf.line(this.margin, rodapeY - 3, this.pageWidth - this.margin, rodapeY - 3);
  }
}