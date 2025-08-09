import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlunoViewRow, searchAlunosView } from '@/integrations/supabase/queries/alunosView';

export function Alunos() {
  const { toast } = useToast();
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AlunoViewRow[]>([]);

  useEffect(() => {
    if (term.trim().length < 3) {
      setRows([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchAlunosView(term.trim());
        setRows(data);
      } catch (e: any) {
        toast({
          variant: 'destructive',
          title: 'Erro na busca',
          description: e?.message ?? 'Falha ao consultar alunos.'
        });
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [term, toast]);

  const info = useMemo(() => {
    if (term.trim().length === 0) return 'Digite ao menos 3 caracteres para buscar.';
    if (term.trim().length > 0 && term.trim().length < 3) return 'Mínimo de 3 caracteres.';
    if (loading) return 'Buscando...';
    if (!loading && rows.length === 0) return 'Nenhum resultado.';
    return `${rows.length} resultado(s)`;
  }, [term, loading, rows.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Consulta de Alunos (VIEW)</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar</CardTitle>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="RA, CPF ou Nome (mín. 3 caracteres)"
              className="pl-10"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-2">{info}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RA</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>CodTurma</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>CH</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={`${r.ra}-${r.disciplina}-${i}`}>
                    <TableCell className="font-medium">{r.ra}</TableCell>
                    <TableCell>{r.cpf ?? '—'}</TableCell>
                    <TableCell>{r.nome}</TableCell>
                    <TableCell>{r.curso ?? '—'}</TableCell>
                    <TableCell>{r.cidade ?? '—'}</TableCell>
                    <TableCell>{r.codturma ?? '—'}</TableCell>
                    <TableCell>{r.disciplina ?? '—'}</TableCell>
                    <TableCell>{r.ch ?? '—'}</TableCell>
                    <TableCell>{r.dtinicio ? new Date(r.dtinicio).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell>{r.dtfim ? new Date(r.dtfim).toLocaleDateString('pt-BR') : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
