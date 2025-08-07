import { useState, useEffect, useCallback } from 'react';
import { Feriado } from '@/types';
import { mockFeriados } from '@/data/mockData';
import { feriadosReaisCombinados2025 } from '@/data/index_feriados_reais_combinados_2025';
import { gerarFeriadosAno, ANOS_SUPORTADOS, AnoSuportado, isAnoSuportado } from '@/data/feriados/feriadosMultiAno';

interface UseFeriadosMultiAnoReturn {
  feriados: Feriado[];
  loading: boolean;
  anoAtual: number;
  anos: readonly number[];
  setAno: (ano: number) => void;
  adicionarFeriado: (feriado: Omit<Feriado, 'id'>) => Feriado;
  atualizarFeriado: (id: string, dadosAtualizados: Partial<Feriado>) => void;
  removerFeriado: (id: string) => void;
  importarFeriados: (ano?: number) => Promise<number>;
  limparCacheAno: (ano?: number) => void;
}

const STORAGE_KEY_PREFIX = 'feriados_';

export function useFeriadosMultiAno(): UseFeriadosMultiAnoReturn {
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoAtual, setAnoAtual] = useState<number>(2025); // Ano padrão fixo

  // Função para carregar feriados de um ano específico
  const carregarFeriadosAno = useCallback((ano: number) => {
    try {
      // Verificar se é um ano suportado
      if (!isAnoSuportado(ano)) {
        console.warn(`Ano ${ano} não suportado. Usando dados de 2025.`);
        ano = 2025;
      }

      const storageKey = `${STORAGE_KEY_PREFIX}${ano}`;
      const savedFeriados = localStorage.getItem(storageKey);
      
      if (savedFeriados) {
        return JSON.parse(savedFeriados) as Feriado[];
      }

      // Se não encontrou no localStorage, usar dados específicos ou gerar
      if (ano === 2025) {
        // Para 2025, usar dados reais importados
        return feriadosReaisCombinados2025;
      } else {
        // Para outros anos, gerar automaticamente
        return gerarFeriadosAno(ano);
      }
    } catch (error) {
      console.error(`Erro ao carregar feriados do ano ${ano}:`, error);
      return mockFeriados;
    }
  }, []);

  // Função para salvar feriados de um ano específico
  const salvarFeriadosAno = useCallback((ano: number, feriadosAno: Feriado[]) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${ano}`;
      localStorage.setItem(storageKey, JSON.stringify(feriadosAno));
    } catch (error) {
      console.error(`Erro ao salvar feriados do ano ${ano}:`, error);
    }
  }, []);

  // Efeito para carregar feriados de todos os anos suportados
  useEffect(() => {
    setLoading(true);
    
    // Carregar feriados de todos os anos suportados para contratos multi-ano
    const todosFeriados: Feriado[] = [];
    
    ANOS_SUPORTADOS.forEach(ano => {
      const feriadosAno = carregarFeriadosAno(ano);
      todosFeriados.push(...feriadosAno);
      salvarFeriadosAno(ano, feriadosAno);
    });
    
    setFeriados(todosFeriados);
    setLoading(false);
  }, [carregarFeriadosAno, salvarFeriadosAno]);

  // Função para mudar o ano
  const setAno = useCallback((novoAno: number) => {
    if (isAnoSuportado(novoAno)) {
      setAnoAtual(novoAno);
    } else {
      console.warn(`Ano ${novoAno} não suportado`);
    }
  }, []);

  // Função para adicionar feriado
  const adicionarFeriado = useCallback((feriado: Omit<Feriado, 'id'>) => {
    const novoFeriado: Feriado = {
      ...feriado,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const novosFeriados = [...feriados, novoFeriado];
    setFeriados(novosFeriados);
    salvarFeriadosAno(anoAtual, novosFeriados);
    
    return novoFeriado;
  }, [feriados, anoAtual, salvarFeriadosAno]);

  // Função para atualizar feriado
  const atualizarFeriado = useCallback((id: string, dadosAtualizados: Partial<Feriado>) => {
    const novosFeriados = feriados.map(f => 
      f.id === id ? { ...f, ...dadosAtualizados } : f
    );
    setFeriados(novosFeriados);
    salvarFeriadosAno(anoAtual, novosFeriados);
  }, [feriados, anoAtual, salvarFeriadosAno]);

  // Função para remover feriado
  const removerFeriado = useCallback((id: string) => {
    const novosFeriados = feriados.filter(f => f.id !== id);
    setFeriados(novosFeriados);
    salvarFeriadosAno(anoAtual, novosFeriados);
  }, [feriados, anoAtual, salvarFeriadosAno]);

  // Função para importar feriados
  const importarFeriados = useCallback(async (ano: number = anoAtual): Promise<number> => {
    setLoading(true);
    try {
      let feriadosImportados: Feriado[];
      
      if (ano === 2025) {
        // Para 2025, usar dados reais
        feriadosImportados = feriadosReaisCombinados2025;
      } else {
        // Para outros anos, gerar automaticamente
        feriadosImportados = gerarFeriadosAno(ano);
      }

      // Se estivermos importando para o ano atual, atualizar estado
      if (ano === anoAtual) {
        // Filtrar apenas feriados que não existem ainda
        const datasExistentes = feriados.map(f => f.data);
        const feriadosNovos = feriadosImportados.filter(f => !datasExistentes.includes(f.data));
        
        if (feriadosNovos.length > 0) {
          const novosFeriados = [...feriados, ...feriadosNovos];
          setFeriados(novosFeriados);
          salvarFeriadosAno(ano, novosFeriados);
        }
        
        return feriadosNovos.length;
      } else {
        // Para outros anos, salvar diretamente
        salvarFeriadosAno(ano, feriadosImportados);
        return feriadosImportados.length;
      }
    } catch (error) {
      console.error('Erro ao importar feriados:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [anoAtual, feriados, salvarFeriadosAno]);

  // Função para limpar cache de ano específico
  const limparCacheAno = useCallback((ano?: number) => {
    try {
      if (ano) {
        const storageKey = `${STORAGE_KEY_PREFIX}${ano}`;
        localStorage.removeItem(storageKey);
        
        // Se for o ano atual, recarregar
        if (ano === anoAtual) {
          const feriadosAno = carregarFeriadosAno(ano);
          setFeriados(feriadosAno);
        }
      } else {
        // Limpar todos os anos
        ANOS_SUPORTADOS.forEach(anoSuportado => {
          const storageKey = `${STORAGE_KEY_PREFIX}${anoSuportado}`;
          localStorage.removeItem(storageKey);
        });
        
        // Recarregar ano atual
        const feriadosAno = carregarFeriadosAno(anoAtual);
        setFeriados(feriadosAno);
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }, [anoAtual, carregarFeriadosAno]);

  return {
    feriados,
    loading,
    anoAtual,
    anos: ANOS_SUPORTADOS,
    setAno,
    adicionarFeriado,
    atualizarFeriado,
    removerFeriado,
    importarFeriados,
    limparCacheAno
  };
}