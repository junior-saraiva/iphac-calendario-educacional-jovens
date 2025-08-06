import { useState, useEffect } from 'react';
import { Trilha, Disciplina } from '@/types';
import { mockTrilhas, mockDisciplinas } from '@/data/mockData';

export function useTrilhas() {
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar trilhas e disciplinas do localStorage ou usar dados mock
    const loadData = () => {
      try {
        const savedTrilhas = localStorage.getItem('trilhas');
        const savedDisciplinas = localStorage.getItem('disciplinas');
        
        if (savedTrilhas && savedDisciplinas) {
          const trilhasData = JSON.parse(savedTrilhas);
          const disciplinasData = JSON.parse(savedDisciplinas);
          
          // Mapear disciplinas para trilhas
          const trilhasComDisciplinas = trilhasData.map((trilha: Trilha) => ({
            ...trilha,
            disciplinas: disciplinasData.filter((d: Disciplina) => d.trilha_id === trilha.id)
          }));
          
          setTrilhas(trilhasComDisciplinas);
          setDisciplinas(disciplinasData);
        } else {
          setTrilhas(mockTrilhas);
          setDisciplinas(mockDisciplinas);
        }
      } catch (error) {
        console.error('Erro ao carregar trilhas:', error);
        setTrilhas(mockTrilhas);
        setDisciplinas(mockDisciplinas);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const saveData = (newTrilhas: Trilha[], newDisciplinas: Disciplina[]) => {
    try {
      localStorage.setItem('trilhas', JSON.stringify(newTrilhas));
      localStorage.setItem('disciplinas', JSON.stringify(newDisciplinas));
      setTrilhas(newTrilhas);
      setDisciplinas(newDisciplinas);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  };

  const adicionarTrilha = (trilha: Omit<Trilha, 'id' | 'disciplinas'>) => {
    const novaTrilha: Trilha = {
      ...trilha,
      id: Date.now().toString(),
      disciplinas: []
    };
    const novasTrilhas = [...trilhas, novaTrilha];
    saveData(novasTrilhas, disciplinas);
    return novaTrilha;
  };

  const atualizarTrilha = (id: string, dadosAtualizados: Partial<Trilha>) => {
    const novasTrilhas = trilhas.map(t => 
      t.id === id ? { ...t, ...dadosAtualizados } : t
    );
    saveData(novasTrilhas, disciplinas);
  };

  const removerTrilha = (id: string) => {
    const novasTrilhas = trilhas.filter(t => t.id !== id);
    const novasDisciplinas = disciplinas.filter(d => d.trilha_id !== id);
    saveData(novasTrilhas, novasDisciplinas);
  };

  const adicionarDisciplina = (disciplina: Omit<Disciplina, 'id'>) => {
    const novaDisciplina: Disciplina = {
      ...disciplina,
      id: Date.now().toString()
    };
    const novasDisciplinas = [...disciplinas, novaDisciplina];
    
    // Atualizar trilha com nova disciplina
    const novasTrilhas = trilhas.map(t => 
      t.id === disciplina.trilha_id 
        ? { ...t, disciplinas: [...t.disciplinas, novaDisciplina] }
        : t
    );
    
    saveData(novasTrilhas, novasDisciplinas);
    return novaDisciplina;
  };

  const atualizarDisciplina = (id: string, dadosAtualizados: Partial<Disciplina>) => {
    const novasDisciplinas = disciplinas.map(d => 
      d.id === id ? { ...d, ...dadosAtualizados } : d
    );
    
    // Atualizar trilhas com disciplina modificada
    const novasTrilhas = trilhas.map(t => ({
      ...t,
      disciplinas: t.disciplinas.map(d => 
        d.id === id ? { ...d, ...dadosAtualizados } : d
      )
    }));
    
    saveData(novasTrilhas, novasDisciplinas);
  };

  const removerDisciplina = (id: string) => {
    const disciplinaRemovida = disciplinas.find(d => d.id === id);
    const novasDisciplinas = disciplinas.filter(d => d.id !== id);
    
    // Atualizar trilhas removendo disciplina
    const novasTrilhas = trilhas.map(t => ({
      ...t,
      disciplinas: t.disciplinas.filter(d => d.id !== id)
    }));
    
    saveData(novasTrilhas, novasDisciplinas);
  };

  const getTrilhasPorTurma = (turmaId: string) => {
    return trilhas.filter(t => t.turma_id === turmaId);
  };

  const calcularCargaHorariaTrilha = (trilhaId: string) => {
    const trilha = trilhas.find(t => t.id === trilhaId);
    return trilha?.disciplinas.reduce((total, d) => total + d.carga_horaria, 0) || 0;
  };

  return {
    trilhas,
    disciplinas,
    loading,
    adicionarTrilha,
    atualizarTrilha,
    removerTrilha,
    adicionarDisciplina,
    atualizarDisciplina,
    removerDisciplina,
    getTrilhasPorTurma,
    calcularCargaHorariaTrilha
  };
}