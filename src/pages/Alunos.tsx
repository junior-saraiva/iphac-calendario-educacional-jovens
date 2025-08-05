import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { mockAlunos, mockTurmas, mockEmpresas } from '@/data/mockData';
import { AlunoForm } from '@/components/AlunoForm';
import { Aluno } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function Alunos() {
  const [alunos, setAlunos] = useState(mockAlunos);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const { toast } = useToast();

  const filteredAlunos = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.cpf.includes(searchTerm) ||
    aluno.matricula.includes(searchTerm)
  );

  const handleCreateAluno = (data: Omit<Aluno, 'id'>) => {
    const newAluno: Aluno = {
      ...data,
      id: (Math.max(...alunos.map(a => parseInt(a.id))) + 1).toString()
    };
    setAlunos([...alunos, newAluno]);
    setIsDialogOpen(false);
    toast({
      title: "Aluno cadastrado",
      description: "Aluno cadastrado com sucesso.",
    });
  };

  const handleUpdateAluno = (data: Omit<Aluno, 'id'>) => {
    if (!editingAluno) return;
    
    const updatedAlunos = alunos.map(aluno => 
      aluno.id === editingAluno.id ? { ...data, id: editingAluno.id } : aluno
    );
    setAlunos(updatedAlunos);
    setEditingAluno(null);
    setIsDialogOpen(false);
    toast({
      title: "Aluno atualizado",
      description: "Dados do aluno atualizados com sucesso.",
    });
  };

  const handleDeleteAluno = (id: string) => {
    setAlunos(alunos.filter(aluno => aluno.id !== id));
    toast({
      title: "Aluno removido",
      description: "Aluno removido com sucesso.",
    });
  };

  const handleEditClick = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAluno(null);
  };

  const getTurmaNome = (turmaId: string) => {
    return mockTurmas.find(t => t.id === turmaId)?.nome || 'N/A';
  };

  const getEmpresaNome = (empresaId: string) => {
    return mockEmpresas.find(e => e.id === empresaId)?.nome || 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAluno(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAluno ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
              </DialogTitle>
            </DialogHeader>
            <AlunoForm
              aluno={editingAluno}
              onSubmit={editingAluno ? handleUpdateAluno : handleCreateAluno}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Dia da Semana</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">{aluno.nome}</TableCell>
                  <TableCell>{aluno.cpf}</TableCell>
                  <TableCell>{aluno.matricula}</TableCell>
                  <TableCell>{getTurmaNome(aluno.turma_id)}</TableCell>
                  <TableCell>{getEmpresaNome(aluno.empresa_id)}</TableCell>
                  <TableCell>{aluno.curso}</TableCell>
                  <TableCell>{aluno.turno}</TableCell>
                  <TableCell>{aluno.dia_aula_semana}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(aluno)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAluno(aluno.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredAlunos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aluno encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}