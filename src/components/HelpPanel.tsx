import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useHelp } from '@/hooks/useHelp';
import { HelpCircle } from 'lucide-react';

interface HelpPanelProps {
  pageKey: string;
  title?: string;
  children: ReactNode;
}

export function HelpPanel({ pageKey, title = 'Como usar esta página', children }: HelpPanelProps) {
  const { showHelp, hideForPage } = useHelp(pageKey);

  if (!showHelp) return null;

  return (
    <Card className="bg-accent/30 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={hideForPage} aria-label="Ocultar ajuda desta página">
          Ocultar
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="prose prose-sm dark:prose-invert max-w-none py-4">
        {children}
      </CardContent>
    </Card>
  );
}

export default HelpPanel;
