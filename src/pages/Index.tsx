import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, Users, BookOpen, FileText } from 'lucide-react';

const Index = () => {
  const stats = [
    { title: 'Alunos Cadastrados', value: '3', icon: Users, color: 'text-blue-600' },
    { title: 'Trilhas Ativas', value: '4', icon: BookOpen, color: 'text-green-600' },
    { title: 'Calendários Gerados', value: '0', icon: Calendar, color: 'text-purple-600' },
    { title: 'PDFs Salvos', value: '0', icon: FileText, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Sistema de geração de calendários para Jovens Aprendizes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Cadastre alunos e empresas parceiras</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Configure trilhas e disciplinas</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Importe ou cadastre feriados</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Gere calendários personalizados</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
