import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarioVisualizer } from '@/components/CalendarioVisualizer';
import { CalendarioGenerator } from '@/lib/calendarioGenerator';
import { Search, Calendar as CalendarIcon, Users } from 'lucide-react';
import { mockAlunos, mockEmpresas, mockTurmas, mockPolos } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { useFeriadosMultiAno } from '@/hooks/useFeriadosMultiAno';
import { useTrilhas } from '@/hooks/useTrilhas';
import { Aluno, CalendarioGerado } from '@/types';

export function Calendario() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [feriasInicio, setFeriasInicio] = useState('');
  const [calendarioGerado, setCalendarioGerado] = useState<CalendarioGerado | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { feriados } = useFeriadosMultiAno();
  const { trilhas } = useTrilhas();

  // Configurar CalendarioGenerator com dados necessários
  useEffect(() => {
    CalendarioGenerator.setFeriados(feriados);
    CalendarioGenerator.setTrilhas(trilhas);
    CalendarioGenerator.setPolos(mockPolos);
    CalendarioGenerator.setEmpresas(mockEmpresas);
  }, [feriados, trilhas]);

  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const filteredAlunos = mockAlunos.filter(aluno => {
    const normalizedSearchTerm = normalizeString(searchTerm);
    return normalizeString(aluno.nome).includes(normalizedSearchTerm) ||
           aluno.cpf.includes(searchTerm) ||
           aluno.matricula.includes(searchTerm);
  });

  const handleAlunoSelect = (alunoId: string) => {
    const aluno = mockAlunos.find(a => a.id === alunoId);
    setSelectedAluno(aluno || null);
    setSearchTerm(aluno?.nome || '');
  };

  const handleGerarCalendario = async () => {
    if (!selectedAluno || !dataInicio || !feriasInicio) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor, selecione um aluno e preencha todas as datas."
      });
      return;
    }

    setIsGenerating(true);
    try {
      const dataInicioDate = new Date(dataInicio);
      const feriasInicioDate = new Date(feriasInicio);
      
      // Calcular data fim automaticamente (24 meses a partir da data de início)
      const dataFim = new Date(dataInicioDate);
      dataFim.setMonth(dataFim.getMonth() + 24); // Exatamente 24 meses

      // Atualizar feriados e trilhas no gerador antes de gerar o calendário
      CalendarioGenerator.setFeriados(feriados);
      CalendarioGenerator.setTrilhas(trilhas);

      const calendario = CalendarioGenerator.gerarCalendario(
        selectedAluno,
        dataInicioDate,
        dataFim,
        feriasInicioDate
      );

      setCalendarioGerado(calendario);
      
      // Calcular duração em meses para feedback
      const duracaoMeses = Math.round((dataFim.getTime() - dataInicioDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      // Estatísticas detalhadas
      const eventosTeoricas = calendario.eventos.filter(e => e.tipo === 'teorica').length;
      const eventosPraticas = calendario.eventos.filter(e => e.tipo === 'pratica').length;
      const eventosFeriados = calendario.eventos.filter(e => e.tipo === 'feriado').length;
      
      toast({
        title: `✅ Calendário gerado com sucesso!`,
        description: `${selectedAluno.nome}: ${duracaoMeses} meses, ${eventosTeoricas} teóricas, ${eventosPraticas} práticas, ${eventosFeriados} feriados`
      });
    } catch (error) {
      console.error('Erro na geração do calendário:', error);
      toast({
        variant: "destructive",
        title: "Erro na validação",
        description: error instanceof Error ? error.message : "Verifique as datas e dados do aluno."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getEmpresaNome = (empresaId: string) => {
    return mockEmpresas.find(e => e.id === empresaId)?.nome || 'Não encontrada';
  };

  const getTurmaNome = (turmaId: string) => {
    return mockTurmas.find(t => t.id === turmaId)?.nome || 'Não encontrada';
  };

  const getPoloNome = (poloId: string) => {
    return mockPolos.find(p => p.id === poloId)?.nome || 'Não encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <CalendarIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Gerar Calendário</h1>
      </div>

      {/* Formulário de Geração */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Dados do Aluno</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Busca do Aluno */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar Aluno</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome, CPF ou matrícula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchTerm && filteredAlunos.length > 0 && !selectedAluno && (
                  <Card className="mt-2">
                    <CardContent className="p-2 max-h-60 overflow-y-auto">
                      {filteredAlunos.map((aluno) => (
                        <div
                          key={aluno.id}
                          className="p-3 hover:bg-accent rounded-md cursor-pointer transition-colors"
                          onClick={() => handleAlunoSelect(aluno.id)}
                        >
                          <div className="font-medium">{aluno.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {aluno.matricula} • {aluno.cpf}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feriasInicio">Início das Férias</Label>
                  <Input
                    id="feriasInicio"
                    type="date"
                    value={feriasInicio}
                    onChange={(e) => setFeriasInicio(e.target.value)}
                  />
                </div>
                {dataInicio && (
                  <div className="p-3 bg-accent/20 rounded-md border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Duração do Contrato:</div>
                    <div className="text-sm">
                      <strong>Data Final:</strong> {new Date(new Date(dataInicio).setMonth(new Date(dataInicio).getMonth() + 24)).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      24 meses (máximo legal)
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGerarCalendario}
                disabled={!selectedAluno || !dataInicio || !feriasInicio || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>Gerando calendário...</>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Gerar Calendário
                  </>
                )}
              </Button>
            </div>

            {/* Dados do Aluno Selecionado */}
            {selectedAluno && (
              <div className="lg:col-span-2">
                <Card className="bg-accent/30 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Aluno Selecionado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xl text-primary">{selectedAluno.nome}</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium text-muted-foreground">Dados Pessoais</div>
                          <div><strong>CPF:</strong> {selectedAluno.cpf}</div>
                          <div><strong>Matrícula:</strong> {selectedAluno.matricula}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium text-muted-foreground">Dados Acadêmicos</div>
                          <div><strong>Curso:</strong> {selectedAluno.curso}</div>
                          <div><strong>Turno:</strong> {selectedAluno.turno}</div>
                          <div><strong>Turma:</strong> {getTurmaNome(selectedAluno.turma_id)}</div>
                          <div><strong>Dia da Aula:</strong> {selectedAluno.dia_aula_semana}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium text-muted-foreground">Vinculações</div>
                          <div><strong>Polo:</strong> {getPoloNome(selectedAluno.polo_id)}</div>
                          <div><strong>Empresa:</strong> {getEmpresaNome(selectedAluno.empresa_id)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visualização do Calendário */}
      {calendarioGerado && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Preview do Calendário</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarioVisualizer calendario={calendarioGerado} />
          </CardContent>
        </Card>
      )}

      {!calendarioGerado && (
        <Card className="w-full">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
              <CalendarIcon className="h-20 w-20 mb-6 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Nenhum calendário gerado</h3>
              <p>Selecione um aluno e preencha as datas para gerar o calendário</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}