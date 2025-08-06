import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarioVisualizer } from '@/components/CalendarioVisualizer';
import { CalendarioGenerator } from '@/lib/calendarioGenerator';
import { Search, Calendar as CalendarIcon, Users } from 'lucide-react';
import { mockAlunos, mockEmpresas, mockTurmas } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { Aluno, CalendarioGerado } from '@/types';

export function Calendario() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [feriasInicio, setFeriasInicio] = useState('');
  const [calendarioGerado, setCalendarioGerado] = useState<CalendarioGerado | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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
      const dataFim = new Date(dataInicio);
      dataFim.setFullYear(dataFim.getFullYear() + 1); // 1 ano de contrato

      const calendario = CalendarioGenerator.gerarCalendario(
        selectedAluno,
        new Date(dataInicio),
        dataFim,
        new Date(feriasInicio)
      );

      setCalendarioGerado(calendario);
      toast({
        title: "Calendário gerado com sucesso!",
        description: `Calendário criado para ${selectedAluno.nome}`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar calendário",
        description: "Ocorreu um erro durante a geração. Tente novamente."
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <CalendarIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Gerar Calendário</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Geração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Dados do Aluno</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {selectedAluno && (
              <Card className="bg-accent/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{selectedAluno.nome}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>CPF:</strong> {selectedAluno.cpf}</div>
                      <div><strong>Matrícula:</strong> {selectedAluno.matricula}</div>
                      <div><strong>Curso:</strong> {selectedAluno.curso}</div>
                      <div><strong>Turno:</strong> {selectedAluno.turno}</div>
                      <div><strong>Turma:</strong> {getTurmaNome(selectedAluno.turma_id)}</div>
                      <div><strong>Empresa:</strong> {getEmpresaNome(selectedAluno.empresa_id)}</div>
                      <div className="col-span-2"><strong>Dia da Aula:</strong> {selectedAluno.dia_aula_semana}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        {/* Visualização do Calendário */}
        <Card>
          <CardHeader>
            <CardTitle>Preview do Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            {calendarioGerado ? (
              <CalendarioVisualizer calendario={calendarioGerado} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <CalendarIcon className="h-16 w-16 mb-4 opacity-50" />
                <p>Selecione um aluno e gere o calendário para visualizar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}