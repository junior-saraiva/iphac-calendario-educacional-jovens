import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarioVisualizer } from '@/components/CalendarioVisualizer';
import { CalendarioGenerator } from '@/lib/calendarioGenerator';
import { Search, Calendar as CalendarIcon, Users } from 'lucide-react';
import { addMonths } from 'date-fns';

import { useToast } from '@/hooks/use-toast';
import { useFeriadosMultiAno } from '@/hooks/useFeriadosMultiAno';
import { useTrilhas } from '@/hooks/useTrilhas';
import { Aluno, CalendarioGerado } from '@/types';
import { searchAlunosView, AlunoViewRow } from '@/integrations/supabase/queries/alunosView';
import { logEvent } from '@/lib/logs';
import HelpPanel from '@/components/HelpPanel';

export function Calendario() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [feriasInicio, setFeriasInicio] = useState('');
  const [feriasInicio2, setFeriasInicio2] = useState('');
  const [feriasModo, setFeriasModo] = useState<'30' | '15+15'>('30');
  const [calendarioGerado, setCalendarioGerado] = useState<CalendarioGerado | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sbResults, setSbResults] = useState<AlunoViewRow[]>([]);
  const [sbLoading, setSbLoading] = useState(false);
  const [empresaNomeExterno, setEmpresaNomeExterno] = useState<string | null>(null);
  const [contratoFim, setContratoFim] = useState<string | null>(null);
  const [turno, setTurno] = useState<'Manhã' | 'Tarde' | 'Noite' | ''>('');
  const [diaSemana, setDiaSemana] = useState<'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | ''>('');
  const [mesFerias, setMesFerias] = useState<'janeiro' | 'junho' | 'julho' | 'dezembro' | ''>('');
  const { toast } = useToast();
  const { feriados } = useFeriadosMultiAno();
  const { trilhas } = useTrilhas();

  // Configurar CalendarioGenerator com dados necessários
  useEffect(() => {
    CalendarioGenerator.setFeriados(feriados);
    CalendarioGenerator.setTrilhas(trilhas);
  }, [feriados, trilhas]);

  // Ajustar feriasInicio automaticamente quando escolher mês de férias
  useEffect(() => {
    if (!dataInicio || !mesFerias) return;
    const inicio = new Date(dataInicio);
    const monthMap: Record<string, number> = { 
      janeiro: 0, 
      junho: 5, 
      julho: 6, 
      dezembro: 11 
    };
    const targetMonth = monthMap[mesFerias];
    let year = inicio.getFullYear();
    if (targetMonth < inicio.getMonth()) {
      year += 1;
    }
    const mm = String(targetMonth + 1).padStart(2, '0');
    const dia = '01';
    setFeriasInicio(`${year}-${mm}-${dia}`);
  }, [dataInicio, mesFerias]);

  // Busca na VIEW por RA/CPF/Nome
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3) {
      setSbResults([]);
      return;
    }
    setSbLoading(true);
    const t = setTimeout(async () => {
      try {
        const rows = await searchAlunosView(searchTerm);
        setSbResults(rows);
        logEvent('info', 'calendario', 'VIEW resultados', { term: searchTerm, qtd: rows.length });
      } catch (e: any) {
        logEvent('error', 'calendario', 'Erro na VIEW', { erro: e?.message });
      } finally {
        setSbLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleAlunoSelectFromView = (row: AlunoViewRow) => {
    setSearchTerm(row.nome);
    if (row.dtinicio) setDataInicio(row.dtinicio.slice(0,10));
    setContratoFim(row.dtfim ? row.dtfim.slice(0,10) : null);
    setEmpresaNomeExterno(row.resfinanceiro || null);

    const alunoMin: Aluno = {
      id: row.ra || (row.cpf || 'sem-id'),
      nome: row.nome,
      cpf: row.cpf || '',
      matricula: row.ra || '',
      turma_id: row.codturma || '',
      empresa_id: '',
      polo_id: '',
      curso: row.curso || '',
      turno: turno || '',
      dia_aula_semana: diaSemana || 'Segunda'
    } as Aluno;

    setSelectedAluno(alunoMin);
    logEvent('info', 'calendario', 'Selecionou da VIEW', { ra: row.ra });
  };

  const handleGerarCalendario = async () => {
    const feriasInicio1Required = !feriasInicio;
    const feriasInicio2Required = feriasModo === '15+15' && !feriasInicio2;
    
    if (!selectedAluno || !dataInicio || feriasInicio1Required || feriasInicio2Required) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios antes de gerar o calendário."
      });
      return;
    }

    setIsGenerating(true);
    try {
      const dataInicioDate = new Date(dataInicio);
      const feriasInicioDate1 = new Date(feriasInicio);
      const feriasInicioDate2 = feriasInicio2 ? new Date(feriasInicio2) : undefined;
      
      // Calcular data fim automaticamente (23 meses a partir da data de início)
      const dataFim = addMonths(dataInicioDate, 23);

      CalendarioGenerator.setFeriados(feriados);
      CalendarioGenerator.setTrilhas(trilhas);

      const alunoParaGerar: Aluno = { ...selectedAluno!, turno: turno as any, dia_aula_semana: diaSemana as any };

      const calendario = CalendarioGenerator.gerarCalendario(
        alunoParaGerar,
        dataInicioDate,
        dataFim,
        feriasModo,
        feriasInicioDate1,
        feriasInicioDate2
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

  const getEmpresaNome = (empresaId: string) => empresaNomeExterno || empresaId || '—';

  const getTurmaNome = (turmaId: string) => turmaId || '—';

  const getPoloNome = (poloId: string) => poloId || '—';

  // Cálculo de datas de término e divergência com o BD
  const dataInicioDateObj = dataInicio ? new Date(dataInicio) : null;
  const dataFimCalculada = dataInicioDateObj ? addMonths(dataInicioDateObj, 23) : null;
  const dataFimCalculadaISO = dataFimCalculada ? dataFimCalculada.toISOString().slice(0, 10) : null;
  const contratoFimISO = contratoFim ? new Date(contratoFim).toISOString().slice(0, 10) : null;
  const fimDivergente = !!(dataFimCalculadaISO && contratoFimISO && dataFimCalculadaISO !== contratoFimISO);

  return (
    <div className="space-y-6">
      <HelpPanel pageKey="calendario">
        <ul className="list-disc pl-5 space-y-1">
          <li>Busque o aluno pela VIEW (nome, CPF ou matrícula) e selecione.</li>
          <li>Informe a Data de Início do contrato e o Início das Férias.</li>
          <li>Clique em Gerar Calendário para ver o preview e métricas do mês.</li>
        </ul>
      </HelpPanel>
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
                

                {searchTerm && sbResults.length > 0 && !selectedAluno && (
                  <Card className="mt-2">
                    <CardContent className="p-2 max-h-60 overflow-y-auto">
                      <div className="px-2 py-1 text-xs text-muted-foreground">Resultados IPHAC (VIEW)</div>
                      {sbResults.map((r) => (
                        <div
                          key={`${r.ra}-${r.disciplina}-${r.ch}-${r.cpf}`}
                          className="p-3 hover:bg-accent rounded-md cursor-pointer transition-colors"
                          onClick={() => handleAlunoSelectFromView(r)}
                        >
                          <div className="font-medium">{r.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            RA {r.ra} • CPF {r.cpf} • {r.resfinanceiro || 'Empresa não informada'}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

               {/* Campos adicionais */}
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

                {/* Modo de Férias */}
                <div className="space-y-2">
                  <Label>Modo de Férias</Label>
                  <Select value={feriasModo} onValueChange={(v) => setFeriasModo(v as '30' | '15+15')}>
                    <SelectTrigger aria-label="Modo de Férias">
                      <SelectValue placeholder="Escolha o modo" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="30">30 dias corridos</SelectItem>
                      <SelectItem value="15+15">15 + 15 dias (dois blocos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mês das Férias (auto preenche feriasInicio) */}
                <div className="space-y-2">
                  <Label>Mês das Férias (1º período)</Label>
                  <Select 
                    value={mesFerias} 
                    onValueChange={(v) => setMesFerias(v as any)}
                    disabled={!dataInicio}
                  >
                    <SelectTrigger aria-label="Mês das Férias">
                      <SelectValue placeholder="Selecione (Dez/Jan/Jun/Jul)" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="dezembro">Dezembro</SelectItem>
                      <SelectItem value="janeiro">Janeiro</SelectItem>
                      <SelectItem value="junho">Junho</SelectItem>
                      <SelectItem value="julho">Julho</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">
                    Apenas meses permitidos: Dezembro, Janeiro, Junho e Julho.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feriasInicio">
                    Início das Férias {feriasModo === '15+15' ? '(1º bloco)' : ''}
                  </Label>
                  <Input
                    id="feriasInicio"
                    type="date"
                    value={feriasInicio}
                    onChange={(e) => setFeriasInicio(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    {feriasModo === '30' ? '30 dias corridos a partir desta data' : '15 dias a partir desta data'}
                  </div>
                </div>

                {/* Segunda data de férias (apenas se modo 15+15) */}
                {feriasModo === '15+15' && (
                  <div className="space-y-2">
                    <Label htmlFor="feriasInicio2">Início das Férias (2º bloco)</Label>
                    <Input
                      id="feriasInicio2"
                      type="date"
                      value={feriasInicio2}
                      onChange={(e) => setFeriasInicio2(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground">
                      15 dias a partir desta data. Deve ser em Dez/Jan/Jun/Jul.
                    </div>
                  </div>
                )}

                {/* Dia da Aula Teórica */}
                <div className="space-y-2">
                  <Label>Dia da Aula Teórica</Label>
                  <Select value={diaSemana} onValueChange={(v) => setDiaSemana(v as any)}>
                    <SelectTrigger aria-label="Dia da Aula Teórica">
                      <SelectValue placeholder="Escolha (Segunda a Sexta)" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="Segunda">Segunda</SelectItem>
                      <SelectItem value="Terça">Terça</SelectItem>
                      <SelectItem value="Quarta">Quarta</SelectItem>
                      <SelectItem value="Quinta">Quinta</SelectItem>
                      <SelectItem value="Sexta">Sexta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dataInicio && (
                  <div className="p-3 bg-accent/20 rounded-md border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Duração do Contrato:</div>
                    <div className="text-sm">
                      <strong>Data Final (calculada):</strong> {dataFimCalculada ? dataFimCalculada.toLocaleDateString('pt-BR') : '—'}
                    </div>
                    {contratoFim && (
                      <div className="text-sm">
                        <strong>Data Final (VIEW):</strong> {new Date(contratoFim).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {fimDivergente && (
                      <div className="text-sm text-destructive font-medium">Atenção: A data calculada diverge da data da base.</div>
                    )}
                    <div className="text-sm text-muted-foreground">23 meses (regra do projeto)</div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGerarCalendario}
                disabled={!selectedAluno || !dataInicio || !feriasInicio || (feriasModo === '15+15' && !feriasInicio2) || isGenerating}
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
                          <div><strong>Dia da Aula:</strong> {diaSemana || selectedAluno.dia_aula_semana}</div>
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