import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CalendarioGerado } from '@/types';
import { Search, FileText, Download, Calendar, Users, Filter, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import HelpPanel from '@/components/HelpPanel';

export function Consulta() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [calendarios, setCalendarios] = useState<(CalendarioGerado & { id: string; data_geracao: string })[]>([]);
  const [filteredCalendarios, setFilteredCalendarios] = useState<(CalendarioGerado & { id: string; data_geracao: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar calendários do localStorage
    const loadCalendarios = () => {
      try {
        const savedCalendarios = localStorage.getItem('calendarios_gerados');
        if (savedCalendarios) {
          const data = JSON.parse(savedCalendarios);
          setCalendarios(data);
          setFilteredCalendarios(data);
        }
      } catch (error) {
        console.error('Erro ao carregar calendários:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCalendarios();
  }, []);

  useEffect(() => {
    // Filtrar calendários baseado no termo de busca
    if (!searchTerm) {
      setFilteredCalendarios(calendarios);
    } else {
      const filtered = calendarios.filter(cal => 
        cal.aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cal.aluno.cpf.includes(searchTerm) ||
        cal.aluno.matricula.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCalendarios(filtered);
    }
  }, [searchTerm, calendarios]);

  const handleDownloadPDF = async (calendario: CalendarioGerado) => {
    try {
      // Simular download - em produção, seria uma chamada para gerar/baixar o PDF
      toast({
        title: 'Download iniciado',
        description: `PDF do calendário de ${calendario.aluno.nome} será baixado.`
      });
      
      // Aqui chamaria a função de geração de PDF
      // await gerarPDF(calendario);
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o PDF.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCalendario = (id: string) => {
    const novoCalendarios = calendarios.filter(cal => cal.id !== id);
    setCalendarios(novoCalendarios);
    localStorage.setItem('calendarios_gerados', JSON.stringify(novoCalendarios));
    
    toast({
      title: 'Calendário removido',
      description: 'O calendário foi excluído do sistema.'
    });
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return data;
    }
  };

  const getStatusBadge = (calendario: CalendarioGerado) => {
    const hoje = new Date();
    const dataFim = new Date(calendario.data_fim);
    
    if (dataFim < hoje) {
      return <Badge variant="outline">Expirado</Badge>;
    } else {
      return <Badge variant="default">Ativo</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando calendários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <HelpPanel pageKey="consulta">
        <ul className="list-disc pl-5 space-y-1">
          <li>Busque pelo aluno (nome, CPF ou matrícula) para filtrar a lista.</li>
          <li>Baixe o PDF do calendário ou remova do histórico quando necessário.</li>
          <li>Use Limpar para remover o filtro rapidamente.</li>
        </ul>
      </HelpPanel>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consultar PDFs</h1>
          <p className="text-muted-foreground mt-2">
            Busque e baixe calendários gerados anteriormente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredCalendarios.length} calendário(s) encontrado(s)
          </Badge>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
          <CardDescription>
            Busque por nome, CPF ou matrícula do aluno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar aluno</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, CPF ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                disabled={!searchTerm}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Calendários */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Calendários Gerados</CardTitle>
          </div>
          <CardDescription>
            Histórico de todos os calendários criados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCalendarios.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Férias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Geração</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalendarios.map((calendario) => (
                    <TableRow key={calendario.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{calendario.aluno.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{calendario.aluno.cpf}</TableCell>
                      <TableCell>{calendario.aluno.matricula}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatarData(calendario.data_inicio)}</div>
                          <div className="text-muted-foreground">
                            até {formatarData(calendario.data_fim)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatarData(calendario.ferias_inicio_1)}</div>
                          <div className="text-muted-foreground">
                            até {formatarData(calendario.ferias_fim_1)}
                          </div>
                          {calendario.ferias_modo === '15+15' && calendario.ferias_inicio_2 && (
                            <>
                              <div className="mt-1">{formatarData(calendario.ferias_inicio_2)}</div>
                              <div className="text-muted-foreground">
                                até {formatarData(calendario.ferias_fim_2!)}
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(calendario)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatarData(calendario.data_geracao)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(calendario)}
                            title="Baixar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCalendario(calendario.id)}
                            title="Excluir calendário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Nenhum calendário encontrado' : 'Nenhum calendário gerado'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca ou verifique se os dados estão corretos.'
                  : 'Gere seu primeiro calendário para vê-lo aparecer aqui.'
                }
              </p>
              {!searchTerm && (
                <Button asChild>
                  <a href="/calendario">
                    <Calendar className="h-4 w-4 mr-2" />
                    Gerar Primeiro Calendário
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      {calendarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Calendários
                  </p>
                  <p className="text-2xl font-bold">{calendarios.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Calendários Ativos
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {calendarios.filter(cal => new Date(cal.data_fim) >= new Date()).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Último Gerado
                  </p>
                  <p className="text-sm font-bold">
                    {calendarios.length > 0 
                      ? formatarData(calendarios[calendarios.length - 1].data_geracao)
                      : 'N/A'
                    }
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
