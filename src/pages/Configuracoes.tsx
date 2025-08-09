import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { testViewConnection } from '@/integrations/supabase/queries/alunosView';
import { logEvent } from '@/lib/logs';
import { ServerCog, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import ImportadorCSV from '@/components/ImportadorCSV';

export default function Configuracoes() {
  const { toast } = useToast();
  const [horas, setHoras] = useState<string>(() => localStorage.getItem('config.horasPorEncontro') || '4');
  const [testing, setTesting] = useState(false);

  const salvar = () => {
    localStorage.setItem('config.horasPorEncontro', horas);
    toast({ title: 'Configurações salvas', description: `Horas por encontro: ${horas}` });
    logEvent('info', 'config', 'Salvou horas por encontro', { horas });
  };

  const testarConexao = async () => {
    setTesting(true);
    try {
      const count = await testViewConnection();
      toast({ title: 'Conexão OK', description: `View acessível. Amostra: ${count}` });
      logEvent('info', 'config', 'Teste de conexão bem-sucedido', { amostra: count });
    } catch (e: any) {
      toast({ title: 'Falha na conexão', description: e?.message || 'Erro desconhecido', variant: 'destructive' });
      logEvent('error', 'config', 'Erro ao testar conexão', { erro: e?.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ServerCog className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> Integração IPHAC / Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Horas por encontro (padrão)</Label>
              <Input type="number" min={1} max={12} value={horas} onChange={(e) => setHoras(e.target.value)} />
              <p className="text-xs text-muted-foreground">Usado temporariamente para estimar encontros a partir de CH.</p>
              <Button className="mt-2" onClick={salvar}><CheckCircle2 className="h-4 w-4 mr-2"/>Salvar</Button>
            </div>

            <div className="space-y-2">
              <Label>Teste de conexão com a VIEW</Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={testarConexao} disabled={testing}>
                  {testing ? 'Testando...' : 'Testar conexão'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Requer a view publicada no banco.</p>
            </div>
          </div>

          <Separator />
          <div className="text-sm text-muted-foreground">
            As credenciais públicas do Supabase já estão embutidas no app. Dados sensíveis nunca são expostos.
          </div>
        </CardContent>
      </Card>

      <ImportadorCSV />
    </div>
  );
}
