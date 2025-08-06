import { useState, useEffect } from 'react';
import { Feriado } from '@/types';
import { mockFeriados } from '@/data/mockData';

export function useFeriados() {
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar feriados do localStorage ou usar dados mock
    const loadFeriados = () => {
      try {
        const savedFeriados = localStorage.getItem('feriados');
        if (savedFeriados) {
          setFeriados(JSON.parse(savedFeriados));
        } else {
          setFeriados(mockFeriados);
        }
      } catch (error) {
        console.error('Erro ao carregar feriados:', error);
        setFeriados(mockFeriados);
      } finally {
        setLoading(false);
      }
    };

    loadFeriados();
  }, []);

  const saveFeriados = (newFeriados: Feriado[]) => {
    try {
      localStorage.setItem('feriados', JSON.stringify(newFeriados));
      setFeriados(newFeriados);
    } catch (error) {
      console.error('Erro ao salvar feriados:', error);
    }
  };

  const adicionarFeriado = (feriado: Omit<Feriado, 'id'>) => {
    const novoFeriado: Feriado = {
      ...feriado,
      id: Date.now().toString()
    };
    const novosFeriados = [...feriados, novoFeriado];
    saveFeriados(novosFeriados);
    return novoFeriado;
  };

  const atualizarFeriado = (id: string, dadosAtualizados: Partial<Feriado>) => {
    const novosFeriados = feriados.map(f => 
      f.id === id ? { ...f, ...dadosAtualizados } : f
    );
    saveFeriados(novosFeriados);
  };

  const removerFeriado = (id: string) => {
    const novosFeriados = feriados.filter(f => f.id !== id);
    saveFeriados(novosFeriados);
  };

  const importarFeriados = async (ano: number = new Date().getFullYear()) => {
    setLoading(true);
    try {
      // Simular importação de API
      // Em produção, usar API real como: https://api.invertexto.com/v1/holidays/{ano}?token=YOUR_TOKEN
      const feriadosImportados: Feriado[] = [
        { id: `imp-${Date.now()}-1`, data: `${ano}-01-01`, descricao: 'Confraternização Universal', nivel: 'nacional' },
        { id: `imp-${Date.now()}-2`, data: `${ano}-04-21`, descricao: 'Tiradentes', nivel: 'nacional' },
        { id: `imp-${Date.now()}-3`, data: `${ano}-05-01`, descricao: 'Dia do Trabalhador', nivel: 'nacional' },
        { id: `imp-${Date.now()}-4`, data: `${ano}-09-07`, descricao: 'Independência do Brasil', nivel: 'nacional' },
        { id: `imp-${Date.now()}-5`, data: `${ano}-10-12`, descricao: 'Nossa Senhora Aparecida', nivel: 'nacional' },
        { id: `imp-${Date.now()}-6`, data: `${ano}-11-02`, descricao: 'Finados', nivel: 'nacional' },
        { id: `imp-${Date.now()}-7`, data: `${ano}-11-15`, descricao: 'Proclamação da República', nivel: 'nacional' },
        { id: `imp-${Date.now()}-8`, data: `${ano}-12-25`, descricao: 'Natal', nivel: 'nacional' }
      ];

      // Filtrar apenas feriados que não existem ainda
      const datasExistentes = feriados.map(f => f.data);
      const feriadosNovos = feriadosImportados.filter(f => !datasExistentes.includes(f.data));
      
      if (feriadosNovos.length > 0) {
        const novosFeriados = [...feriados, ...feriadosNovos];
        saveFeriados(novosFeriados);
      }

      return feriadosNovos.length;
    } catch (error) {
      console.error('Erro ao importar feriados:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    feriados,
    loading,
    adicionarFeriado,
    atualizarFeriado,
    removerFeriado,
    importarFeriados
  };
}