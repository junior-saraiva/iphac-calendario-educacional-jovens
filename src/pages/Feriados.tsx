import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Feriado } from '@/types';
import { mockFeriados } from '@/data/mockData';
import { Calendar, Download, Edit, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Feriados() {
  const { toast } = useToast();
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeriado, setEditingFeriado] = useState<Feriado | null>(null);
  const [formData, setFormData] = useState({
    data: '',
    descricao: '',
    nivel: 'nacional' as 'nacional' | 'estadual' | 'municipal'
  });

  useEffect(() => {
    // Carregar feriados mockados inicialmente
    setFeriados(mockFeriados);
  }, []);

  const handleImportarFeriados = async () => {
    setLoading(true);
    try {
      // Simular importação de API de feriados brasileiros
      const response = await fetch('/api/feriados/brasil/2025');
      if (!response.ok) {
        // Fallback para dados mockados + alguns feriados adicionais
        const novosFeriados: Feriado[] = [
          { id: Date.now().toString(), data: '2025-09-07', descricao: 'Independência do Brasil', nivel: 'nacional' },
          { id: (Date.now() + 1).toString(), data: '2025-10-12', descricao: 'Nossa Senhora Aparecida', nivel: 'nacional' },
          { id: (Date.now() + 2).toString(), data: '2025-11-02', descricao: 'Finados', nivel: 'nacional' },
          { id: (Date.now() + 3).toString(), data: '2025-11-15', descricao: 'Proclamação da República', nivel: 'nacional' },
          { id: (Date.now() + 4).toString(), data: '2025-12-25', descricao: 'Natal', nivel: 'nacional' }
        ];
        
        setFeriados(prev => {
          const existingDates = prev.map(f => f.data);
          const uniqueNew = novosFeriados.filter(f => !existingDates.includes(f.data));
          return [...prev, ...uniqueNew];
        });
        
        toast({
          title: 'Feriados importados',
          description: `${novosFeriados.length} feriados adicionados com sucesso.`
        });
      }
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível importar os feriados. Usando dados locais.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarFeriado = () => {
    if (!formData.data || !formData.descricao) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (editingFeriado) {
      // Editar feriado existente
      setFeriados(prev => prev.map(f => 
        f.id === editingFeriado.id 
          ? { ...f, ...formData }
          : f
      ));
      toast({
        title: 'Feriado atualizado',
        description: 'O feriado foi atualizado com sucesso.'
      });
    } else {
      // Criar novo feriado
      const novoFeriado: Feriado = {
        id: Date.now().toString(),
        ...formData
      };
      setFeriados(prev => [...prev, novoFeriado]);
      toast({
        title: 'Feriado criado',
        description: 'O feriado foi criado com sucesso.'
      });
    }

    setIsDialogOpen(false);
    setEditingFeriado(null);
    setFormData({ data: '', descricao: '', nivel: 'nacional' });
  };

  const handleEditarFeriado = (feriado: Feriado) => {
    setEditingFeriado(feriado);
    setFormData({
      data: feriado.data,
      descricao: feriado.descricao,
      nivel: feriado.nivel
    });
    setIsDialogOpen(true);
  };

  const handleExcluirFeriado = (id: string) => {
    setFeriados(prev => prev.filter(f => f.id !== id));
    toast({
      title: 'Feriado excluído',
      description: 'O feriado foi removido com sucesso.'
    });
  };

  const handleNovoFeriado = () => {
    setEditingFeriado(null);
    setFormData({ data: '', descricao: '', nivel: 'nacional' });
    setIsDialogOpen(true);
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return data;
    }
  };

  const getNivelBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case 'nacional': return 'default';
      case 'estadual': return 'secondary';
      case 'municipal': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Feriados</h1>
          <p className="text-muted-foreground mt-2">
            Importe feriados nacionais ou cadastre feriados locais específicos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleImportarFeriados} 
            disabled={loading}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Importando...' : 'Importar Feriados'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNovoFeriado}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Feriado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingFeriado ? 'Editar Feriado' : 'Novo Feriado'}
                </DialogTitle>
                <DialogDescription>
                  {editingFeriado 
                    ? 'Modifique as informações do feriado.'
                    : 'Adicione um novo feriado ao sistema.'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    placeholder="Ex: Independência do Brasil"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nivel">Nível</Label>
                  <Select value={formData.nivel} onValueChange={(value) => setFormData(prev => ({ ...prev, nivel: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nacional">Nacional</SelectItem>
                      <SelectItem value="estadual">Estadual</SelectItem>
                      <SelectItem value="municipal">Municipal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleSalvarFeriado}>
                  {editingFeriado ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Feriados Cadastrados</CardTitle>
          </div>
          <CardDescription>
            Lista de todos os feriados que afetarão a geração de calendários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feriados
                .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                .map((feriado) => (
                <TableRow key={feriado.id}>
                  <TableCell className="font-medium">
                    {formatarData(feriado.data)}
                  </TableCell>
                  <TableCell>{feriado.descricao}</TableCell>
                  <TableCell>
                    <Badge variant={getNivelBadgeVariant(feriado.nivel)}>
                      {feriado.nivel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditarFeriado(feriado)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluirFeriado(feriado.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {feriados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum feriado cadastrado. Importe ou adicione feriados manualmente.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}