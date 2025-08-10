import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useTrilhas } from '@/hooks/useTrilhas';
import { Trilha, Disciplina } from '@/types';
import { mockTurmas } from '@/data/mockData';
import { BookOpen, Plus, Edit, Trash2, Clock, GraduationCap, Users } from 'lucide-react';
import HelpPanel from '@/components/HelpPanel';

export function Trilhas() {
  const { toast } = useToast();
  const {
    trilhas,
    disciplinas,
    loading,
    adicionarTrilha,
    atualizarTrilha,
    removerTrilha,
    adicionarDisciplina,
    atualizarDisciplina,
    removerDisciplina,
    calcularCargaHorariaTrilha
  } = useTrilhas();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDisciplinaDialogOpen, setIsDisciplinaDialogOpen] = useState(false);
  const [editingTrilha, setEditingTrilha] = useState<Trilha | null>(null);
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
  const [selectedTrilhaId, setSelectedTrilhaId] = useState<string>('');

  const [trilhaFormData, setTrilhaFormData] = useState({
    nome: '',
    codigo: '',
    tipo: 'integracao' as 'integracao' | 'especifica' | 'profissional' | 'empregabilidade',
    turma_id: ''
  });

  const [disciplinaFormData, setDisciplinaFormData] = useState({
    nome: '',
    carga_horaria: '',
    quantidade_encontros: '',
    dias_aula: [] as string[]
  });

  const handleSalvarTrilha = () => {
    if (!trilhaFormData.nome || !trilhaFormData.codigo || !trilhaFormData.turma_id) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (editingTrilha) {
      atualizarTrilha(editingTrilha.id, trilhaFormData);
      toast({
        title: 'Trilha atualizada',
        description: 'A trilha foi atualizada com sucesso.'
      });
    } else {
      adicionarTrilha(trilhaFormData);
      toast({
        title: 'Trilha criada',
        description: 'A trilha foi criada com sucesso.'
      });
    }

    setIsDialogOpen(false);
    setEditingTrilha(null);
    setTrilhaFormData({ nome: '', codigo: '', tipo: 'integracao', turma_id: '' });
  };

  const handleSalvarDisciplina = () => {
    if (!disciplinaFormData.nome || !disciplinaFormData.carga_horaria || !disciplinaFormData.quantidade_encontros || !selectedTrilhaId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    const dadosDisciplina = {
      ...disciplinaFormData,
      trilha_id: selectedTrilhaId,
      carga_horaria: parseInt(disciplinaFormData.carga_horaria),
      quantidade_encontros: parseInt(disciplinaFormData.quantidade_encontros)
    };

    if (editingDisciplina) {
      atualizarDisciplina(editingDisciplina.id, dadosDisciplina);
      toast({
        title: 'Disciplina atualizada',
        description: 'A disciplina foi atualizada com sucesso.'
      });
    } else {
      adicionarDisciplina(dadosDisciplina);
      toast({
        title: 'Disciplina criada',
        description: 'A disciplina foi criada com sucesso.'
      });
    }

    setIsDisciplinaDialogOpen(false);
    setEditingDisciplina(null);
    setDisciplinaFormData({ nome: '', carga_horaria: '', quantidade_encontros: '', dias_aula: [] });
  };

  const handleEditarTrilha = (trilha: Trilha) => {
    setEditingTrilha(trilha);
    setTrilhaFormData({
      nome: trilha.nome,
      codigo: trilha.codigo,
      tipo: trilha.tipo,
      turma_id: trilha.turma_id
    });
    setIsDialogOpen(true);
  };

  const handleEditarDisciplina = (disciplina: Disciplina) => {
    setEditingDisciplina(disciplina);
    setSelectedTrilhaId(disciplina.trilha_id);
    setDisciplinaFormData({
      nome: disciplina.nome,
      carga_horaria: disciplina.carga_horaria.toString(),
      quantidade_encontros: disciplina.quantidade_encontros.toString(),
      dias_aula: disciplina.dias_aula
    });
    setIsDisciplinaDialogOpen(true);
  };

  const handleNovaTrilha = () => {
    setEditingTrilha(null);
    setTrilhaFormData({ nome: '', codigo: '', tipo: 'integracao', turma_id: '' });
    setIsDialogOpen(true);
  };

  const handleNovaDisciplina = (trilhaId: string) => {
    setEditingDisciplina(null);
    setSelectedTrilhaId(trilhaId);
    setDisciplinaFormData({ nome: '', carga_horaria: '', quantidade_encontros: '', dias_aula: [] });
    setIsDisciplinaDialogOpen(true);
  };

  const getTipoVariant = (tipo: string) => {
    switch (tipo) {
      case 'integracao': return 'default';
      case 'especifica': return 'secondary';
      case 'profissional': return 'destructive';
      case 'empregabilidade': return 'outline';
      default: return 'default';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'integracao': return 'Integração';
      case 'especifica': return 'Específica';
      case 'profissional': return 'Profissional';
      case 'empregabilidade': return 'Empregabilidade';
      default: return tipo;
    }
  };

  const getTurmaNome = (turmaId: string) => {
    return mockTurmas.find(t => t.id === turmaId)?.nome || 'Não encontrada';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <HelpPanel pageKey="trilhas">
        <ul className="list-disc pl-5 space-y-1">
          <li>Crie uma trilha em Nova Trilha e defina tipo e turma.</li>
          <li>Na aba Disciplinas, adicione carga horária e encontros por trilha.</li>
          <li>Use o acordeão para gerenciar disciplinas e ações por item.</li>
        </ul>
      </HelpPanel>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trilhas & Disciplinas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie trilhas de aprendizagem e suas disciplinas
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNovaTrilha}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Trilha
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTrilha ? 'Editar Trilha' : 'Nova Trilha'}
                </DialogTitle>
                <DialogDescription>
                  {editingTrilha 
                    ? 'Modifique as informações da trilha.'
                    : 'Adicione uma nova trilha de aprendizagem.'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Trilha</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Trilha Introdutória"
                    value={trilhaFormData.nome}
                    onChange={(e) => setTrilhaFormData(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    placeholder="Ex: TR001"
                    value={trilhaFormData.codigo}
                    onChange={(e) => setTrilhaFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={trilhaFormData.tipo} onValueChange={(value) => setTrilhaFormData(prev => ({ ...prev, tipo: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="integracao">Integração</SelectItem>
                      <SelectItem value="especifica">Específica</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="empregabilidade">Empregabilidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="turma">Turma</Label>
                  <Select value={trilhaFormData.turma_id} onValueChange={(value) => setTrilhaFormData(prev => ({ ...prev, turma_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTurmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleSalvarTrilha}>
                  {editingTrilha ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="trilhas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trilhas">Trilhas</TabsTrigger>
          <TabsTrigger value="disciplinas">Disciplinas por Trilha</TabsTrigger>
        </TabsList>

        <TabsContent value="trilhas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Trilhas de Aprendizagem</CardTitle>
              </div>
              <CardDescription>
                Visualize e gerencie todas as trilhas cadastradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Disciplinas</TableHead>
                    <TableHead>Carga Horária</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trilhas.map((trilha) => (
                    <TableRow key={trilha.id}>
                      <TableCell className="font-medium">{trilha.nome}</TableCell>
                      <TableCell>{trilha.codigo}</TableCell>
                      <TableCell>
                        <Badge variant={getTipoVariant(trilha.tipo)}>
                          {getTipoLabel(trilha.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getTurmaNome(trilha.turma_id)}</TableCell>
                      <TableCell>{trilha.disciplinas.length}</TableCell>
                      <TableCell>{calcularCargaHorariaTrilha(trilha.id)}h</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditarTrilha(trilha)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerTrilha(trilha.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {trilhas.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma trilha cadastrada. Adicione sua primeira trilha.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disciplinas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle>Disciplinas por Trilha</CardTitle>
              </div>
              <CardDescription>
                Gerencie disciplinas organizadas por trilha de aprendizagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trilhas.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {trilhas.map((trilha) => (
                    <AccordionItem key={trilha.id} value={trilha.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center space-x-3">
                            <Badge variant={getTipoVariant(trilha.tipo)}>
                              {getTipoLabel(trilha.tipo)}
                            </Badge>
                            <span className="font-medium">{trilha.nome}</span>
                            <span className="text-sm text-muted-foreground">
                              ({trilha.disciplinas.length} disciplinas)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{calcularCargaHorariaTrilha(trilha.id)}h</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">
                              Disciplinas da trilha {trilha.nome}
                            </p>
                            <Button
                              size="sm"
                              onClick={() => handleNovaDisciplina(trilha.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Nova Disciplina
                            </Button>
                          </div>
                          
                          {trilha.disciplinas.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Carga Horária</TableHead>
                                  <TableHead>Qtd. Encontros</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {trilha.disciplinas.map((disciplina) => (
                                  <TableRow key={disciplina.id}>
                                    <TableCell className="font-medium">
                                      {disciplina.nome}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{disciplina.carga_horaria}h</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-1">
                                        <BookOpen className="h-4 w-4" />
                                        <span>{disciplina.quantidade_encontros}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditarDisciplina(disciplina)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removerDisciplina(disciplina.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                              <p>Nenhuma disciplina cadastrada nesta trilha.</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => handleNovaDisciplina(trilha.id)}
                              >
                                Adicionar primeira disciplina
                              </Button>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma trilha disponível. Crie uma trilha primeiro.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Disciplinas */}
      <Dialog open={isDisciplinaDialogOpen} onOpenChange={setIsDisciplinaDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingDisciplina ? 'Editar Disciplina' : 'Nova Disciplina'}
            </DialogTitle>
            <DialogDescription>
              {editingDisciplina 
                ? 'Modifique as informações da disciplina.'
                : 'Adicione uma nova disciplina à trilha.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nomeDisciplina">Nome da Disciplina</Label>
              <Input
                id="nomeDisciplina"
                placeholder="Ex: Introdução à Programação"
                value={disciplinaFormData.nome}
                onChange={(e) => setDisciplinaFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cargaHoraria">Carga Horária (horas)</Label>
              <Input
                id="cargaHoraria"
                type="number"
                placeholder="Ex: 80"
                value={disciplinaFormData.carga_horaria}
                onChange={(e) => setDisciplinaFormData(prev => ({ ...prev, carga_horaria: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantidadeEncontros">Quantidade de Encontros</Label>
              <Input
                id="quantidadeEncontros"
                type="number"
                placeholder="Ex: 10"
                value={disciplinaFormData.quantidade_encontros}
                onChange={(e) => setDisciplinaFormData(prev => ({ ...prev, quantidade_encontros: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSalvarDisciplina}>
              {editingDisciplina ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
