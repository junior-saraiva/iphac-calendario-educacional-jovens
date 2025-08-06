import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  CalendarDays, 
  FileText, 
  LogOut,
  Home
} from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Alunos', path: '/alunos' },
    { icon: BookOpen, label: 'Trilhas & Disciplinas', path: '/trilhas' },
    { icon: Calendar, label: 'Feriados', path: '/feriados' },
    { icon: CalendarDays, label: 'Gerar Calendário', path: '/calendario' },
    { icon: FileText, label: 'Consultar PDFs', path: '/consulta' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sistema de Calendários</h1>
              <p className="text-xs text-muted-foreground">IPHAC - Jovem Aprendiz</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <span className="text-sm text-muted-foreground">
                Olá, <strong className="text-foreground">{user?.nome}</strong>
              </span>
              <p className="text-xs text-muted-foreground">
                {user?.perfil}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="hover:bg-destructive hover:text-destructive-foreground transition-colors">
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 space-y-2">
            <Card className="p-4 bg-card/50 backdrop-blur">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:translate-x-1 group"
                  >
                    <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 lg:max-w-none">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}