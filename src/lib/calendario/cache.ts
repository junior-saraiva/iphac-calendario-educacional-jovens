import { Feriado } from '@/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class CalendarioCache {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Armazena dados no cache com TTL
   */
  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    this.cache.set(key, entry);
  }

  /**
   * Recupera dados do cache se ainda válidos
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Verifica se uma chave existe no cache e ainda é válida
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove uma entrada específica do cache
   */
  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Remove entradas expiradas do cache
   */
  static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Gera chave de cache para feriados por período e localização
   */
  static gerarChaveFeriados(
    dataInicio: string,
    dataFim: string,
    cidade: string,
    uf: string
  ): string {
    return `feriados:${dataInicio}:${dataFim}:${cidade}:${uf}`;
  }

  /**
   * Gera chave de cache para trilhas por turma
   */
  static gerarChaveTrilhas(turmaId: string): string {
    return `trilhas:${turmaId}`;
  }

  /**
   * Obtém estatísticas do cache
   */
  static getStats(): {
    totalEntries: number;
    expiredEntries: number;
    cacheHitRate: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;
    let totalEntries = this.cache.size;

    this.cache.forEach(entry => {
      if (now > entry.expiry) {
        expiredEntries++;
      }
    });

    return {
      totalEntries,
      expiredEntries,
      cacheHitRate: 0 // Seria necessário rastrear hits/misses para calcular isso
    };
  }
}