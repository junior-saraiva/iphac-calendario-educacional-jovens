import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLogs, clearLogs } from '@/lib/logs';
import { Trash2, ListTree } from 'lucide-react';
import HelpPanel from '@/components/HelpPanel';

export default function Logs() {
  const [tick, setTick] = useState(0);
  const logs = useMemo(() => getLogs(), [tick]);

  const limpar = () => {
    clearLogs();
    setTick((x) => x + 1);
  };

  return (
    <div className="space-y-6">
      <HelpPanel pageKey="logs">
        <ul className="list-disc pl-5 space-y-1">
          <li>Consulte eventos recentes gerados pelo aplicativo.</li>
          <li>Use o botão Limpar para reiniciar o histórico local.</li>
        </ul>
      </HelpPanel>
      <div className="flex items-center gap-3">
        <ListTree className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Logs</h1>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between flex-row">
          <CardTitle>Eventos recentes</CardTitle>
          <Button variant="outline" onClick={limpar}><Trash2 className="h-4 w-4 mr-2"/>Limpar</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.length === 0 && (
            <div className="text-sm text-muted-foreground">Sem logs até o momento.</div>
          )}
          <div className="space-y-3">
            {logs.map((l) => (
              <div key={l.id} className="p-3 rounded-md border bg-card">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{l.source}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{new Date(l.ts).toLocaleString('pt-BR')}</Badge>
                    <Badge variant={l.level === 'error' ? 'destructive' : l.level === 'warn' ? 'secondary' : 'default'}>{l.level}</Badge>
                  </div>
                </div>
                <div className="text-sm mt-1">{l.message}</div>
                {l.meta && (
                  <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">{JSON.stringify(l.meta, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
