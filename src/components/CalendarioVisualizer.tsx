import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarioGerado, CalendarioEvento } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PDFGenerator } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface CalendarioVisualizerProps {
  calendario: CalendarioGerado;
}

export function CalendarioVisualizer({ calendario }: CalendarioVisualizerProps) {
  const [mesAtual, setMesAtual] = useState(new Date(calendario.data_inicio));
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes });

  const getEventoPorData = (data: Date): CalendarioEvento | null => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return calendario.eventos.find(evento => evento.data === dataStr) || null;
  };

  const getTipoEventoClass = (tipo: CalendarioEvento['tipo']) => {
    const classes = {
      teorica: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100',
      pratica: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100',
      feriado: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100',
      ferias: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100'
    };
    return classes[tipo] || '';
  };

  const proximoMes = () => setMesAtual(addMonths(mesAtual, 1));
  const mesAnterior = () => setMesAtual(subMonths(mesAtual, 1));

  const handleGerarPDF = async () => {
    try {
      setGerandoPDF(true);
      await PDFGenerator.gerarPDF(calendario, calendario.aluno.nome);
      toast({
        title: "PDF gerado com sucesso!",
        description: "O calendário foi baixado para seu dispositivo.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o calendário em PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGerandoPDF(false);
    }
  };

  const handleVisualizarImpressao = () => {
    navigate('/calendario/impressao', { 
      state: { calendario } 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <p className="text-sm text-muted-foreground">
            Calendário de {calendario.aluno.nome}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={mesAnterior}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={proximoMes}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleVisualizarImpressao}
          >
            <Printer className="h-4 w-4 mr-2" />
            Visualizar Impressão
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGerarPDF}
            disabled={gerandoPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            {gerandoPDF ? 'Gerando...' : 'PDF Antigo'}
          </Button>
        </div>
      </div>

      {/* Legenda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">Aula Teórica</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Prática na Empresa</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">Feriado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm">Férias</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid do Calendário */}
      <Card>
        <CardContent className="p-6">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <div key={dia} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {dia}
              </div>
            ))}
          </div>

          {/* Grid dos dias */}
          <div className="grid grid-cols-7 gap-2">
            {/* Espaços vazios para o início do mês */}
            {Array.from({ length: inicioMes.getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="h-24"></div>
            ))}

            {/* Dias do mês */}
            {diasDoMes.map((dia) => {
              const evento = getEventoPorData(dia);
              const isToday = isSameDay(dia, new Date());
              const dayOfMonth = dia.getDate();

              return (
                <div
                  key={dia.toString()}
                  className={cn(
                    "h-20 p-2 border rounded-lg transition-colors relative",
                    isToday && "ring-2 ring-primary",
                    !isSameMonth(dia, mesAtual) && "opacity-50",
                    "hover:bg-accent/50"
                  )}
                >
                  <div className="flex flex-col h-full">
                    <span className={cn(
                      "text-sm font-medium",
                      isToday && "text-primary font-bold"
                    )}>
                      {dayOfMonth}
                    </span>
                    
                    {evento && (
                      <div className="mt-1 flex-1">
                        <div className={cn(
                          "text-xs p-1 rounded text-center font-medium border",
                          getTipoEventoClass(evento.tipo)
                        )}>
                          {evento.tipo === 'teorica' ? 'Teórica' :
                           evento.tipo === 'pratica' ? 'Prática' :
                           evento.tipo === 'feriado' ? 'Feriado' :
                           'Férias'}
                        </div>
                        
                        {evento.disciplina && (
                          <div className="text-xs text-muted-foreground mt-1 truncate" title={evento.disciplina}>
                            {evento.disciplina}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Mês */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['teorica', 'pratica', 'feriado', 'ferias'] as const).map((tipo) => {
              const count = calendario.eventos.filter(evento => {
                const eventoData = new Date(evento.data);
                return evento.tipo === tipo && 
                       eventoData >= inicioMes && 
                       eventoData <= fimMes;
              }).length;

              const labels = {
                teorica: 'Aulas Teóricas',
                pratica: 'Dias Práticos',
                feriado: 'Feriados',
                ferias: 'Dias de Férias'
              };

              return (
                <div key={tipo} className="text-center">
                  <div className="text-2xl font-bold text-primary">{count}</div>
                  <div className="text-sm text-muted-foreground">{labels[tipo]}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}