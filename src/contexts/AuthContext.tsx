import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface User {
  id: string;
  nome: string;
  email: string;
  perfil: 'administrador' | 'operador' | 'consulta';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const cleanupAuthState = () => {
  try {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {}
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionToUser = (session: Session | null): User | null => {
    const u = session?.user;
    if (!u) return null;
    const nomeFromEmail = u.email ? u.email.split('@')[0] : 'Usuário';
    const nome = (u.user_metadata as any)?.full_name || nomeFromEmail;
    // Default UI role; database RLS enforces real permissions
    return {
      id: u.id,
      nome,
      email: u.email || '',
      perfil: 'consulta',
    };
  };

  useEffect(() => {
    // 1) Listen first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(sessionToUser(session));
    });

    // 2) Then get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(sessionToUser(session));
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsLoading(false);
        return false;
      }
      // Full refresh to ensure clean state
      window.location.href = '/';
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    cleanupAuthState();
    supabase.auth.signOut({ scope: 'global' }).finally(() => {
      window.location.href = '/login';
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
