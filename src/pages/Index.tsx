import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFeriados } from '@/hooks/useFeriados';
import { useTrilhas } from '@/hooks/useTrilhas';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { toast } = useToast();
  const { feriados } = useFeriados();
  const { trilhas } = useTrilhas();
  const [calendarioGerados, setCalendarioGerados] = useState(0);
  const [setupProgress, setSetupProgress] = useState(0);
  const [alunosCount, setAlunosCount] = useState<number | null>(null);
  // Carregar PDFs gerados e contar alunos reais via Supabase
  useEffect(() => {
    const savedPDFs = localStorage.getItem('calendarios_gerados');
    const qtdPDFs = savedPDFs ? JSON.parse(savedPDFs).length : 0;
    setCalendarioGerados(qtdPDFs);

    const calcularProgresso = (alunosC: number | null) => {
      let progress = 0;
      if (alunosC && alunosC > 0) progress += 25;
      if (trilhas.length > 0) progress += 25;
      if (feriados.length > 0) progress += 25;
      if (qtdPDFs > 0) progress += 25;
      setSetupProgress(progress);
    };

    const fetchCount = async () => {
      try {
        const { count, error } = await supabase
          .from('alunos_view_cache')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        setAlunosCount(count ?? 0);
        calcularProgresso(count ?? 0);
      } catch (e) {
        setAlunosCount(null);
        calcularProgresso(null);
      }
    };

    fetchCount();
  }, [trilhas.length, feriados.length]);

  const stats = [
    { 
      title: 'Alunos Cadastrados', 
      value: alunosCount !== null ? alunosCount.toString() : '—', 
      icon: Users, 
      color: 'text-blue-600',
      change: alunosCount !== null ? 'contagem real' : 'acesso restrito',
      changeType: alunosCount !== null ? 'neutral' as const : 'warning' as const
    },
    { 
      title: 'Trilhas Ativas', 
      value: trilhas.length.toString(), 
      icon: BookOpen, 
      color: 'text-green-600',
      change: `${trilhas.reduce((acc, t) => acc + t.disciplinas.length, 0)} disciplinas`,
      changeType: 'neutral' as const
    },
    { 
      title: 'Calendários Gerados', 
      value: calendarioGerados.toString(), 
      icon: Calendar, 
      color: 'text-purple-600',
      change: calendarioGerados > 0 ? 'Ativos' : 'Aguardando',
      changeType: calendarioGerados > 0 ? 'positive' as const : 'warning' as const
    },
    { 
      title: 'Feriados Cadastrados', 
      value: feriados.length.toString(), 
      icon: FileText, 
      color: 'text-orange-600',
      change: 'Nacional/Local',
      changeType: 'neutral' as const
    },
  ];

  const getChangeColor = (type: 'positive' | 'negative' | 'neutral' | 'warning') => {
    switch (type) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  const taskList = [
    {
      title: 'Consultar alunos (VIEW)',
      completed: alunosCount !== null ? alunosCount > 0 : false,
      link: '/alunos',
      description: 'Pesquisar alunos (dados reais)'
    },
    {
      title: 'Configurar trilhas e disciplinas',
      completed: trilhas.length > 0,
      link: '/trilhas',
      description: 'Monte o currículo de aprendizagem'
    },
    {
      title: 'Importar feriados',
      completed: feriados.length > 0,
      link: '/feriados',
      description: 'Configure datas que afetam o calendário'
    },
    {
      title: 'Gerar primeiro calendário',
      completed: calendarioGerados > 0,
      link: '/calendario',
      description: 'Teste a geração de calendários'
    }
  ];

  const completedTasks = taskList.filter(task => task.completed).length;
  const nextTask = taskList.find(task => !task.completed);

  const handleQuickStart = () => {
    toast({
      title: 'Início Rápido',
      description: 'Siga os passos para configurar sua primeira geração de calendário!'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com ação rápida */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Sistema de geração de calendários para Jovens Aprendizes
          </p>
        </div>
        {setupProgress < 100 && (
          <Button onClick={handleQuickStart} className="lg:w-auto">
            <TrendingUp className="h-4 w-4 mr-2" />
            Início Rápido
          </Button>
        )}
      </div>

      {/* Progress do Setup */}
      {setupProgress < 100 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Progresso da Configuração
              </CardTitle>
              <Badge variant={setupProgress === 100 ? "default" : "secondary"}>
                {setupProgress}% Completo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={setupProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {setupProgress === 100 
                ? '🎉 Configuração completa! Agora você pode gerar calendários.'
                : `Faltam ${4 - completedTasks} etapas para finalizar a configuração inicial.`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas com animação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${getChangeColor(stat.changeType)}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Tarefas Interativa */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Lista de Configuração
              </CardTitle>
              <Badge variant="outline">
                {completedTasks}/{taskList.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {taskList.map((task, index) => (
              <div key={task.title} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center space-x-3">
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {task.description}
                    </div>
                  </div>
                </div>
                {!task.completed && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={task.link}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
            
            {nextTask && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary">
                      Próximo passo: {nextTask.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {nextTask.description}
                    </div>
                  </div>
                  <Button size="sm" asChild>
                    <Link to={nextTask.link}>
                      Ir agora
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo Estatístico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Resumo do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="text-2xl font-bold text-blue-600">
                  {trilhas.reduce((acc, t) => acc + t.disciplinas.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Disciplinas
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="text-2xl font-bold text-green-600">
                  {trilhas.reduce((acc, t) => acc + t.disciplinas.reduce((a, d) => a + d.carga_horaria, 0), 0)}h
                </div>
                <div className="text-sm text-muted-foreground">
                  Carga Horária Total
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Trilhas por tipo:</span>
              </div>
              {['integracao', 'especifica', 'profissional', 'empregabilidade'].map(tipo => {
                const count = trilhas.filter(t => t.tipo === tipo).length;
                const label = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                return (
                  <div key={tipo} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                );
              })}
            </div>

            {setupProgress === 100 && (
              <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Sistema pronto para uso!
                  </span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Todas as configurações básicas foram concluídas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
              <Link to="/calendario">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="font-medium">Gerar Calendário</span>
                <span className="text-xs text-muted-foreground text-center">
                  Criar novo calendário para aluno
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
              <Link to="/alunos">
                <Users className="h-6 w-6 text-primary" />
                <span className="font-medium">Consultar Alunos</span>
                <span className="text-xs text-muted-foreground text-center">
                  Pesquisar e visualizar alunos (VIEW)
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
              <Link to="/feriados">
                <FileText className="h-6 w-6 text-primary" />
                <span className="font-medium">Importar Feriados</span>
                <span className="text-xs text-muted-foreground text-center">
                  Atualizar lista de feriados
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;