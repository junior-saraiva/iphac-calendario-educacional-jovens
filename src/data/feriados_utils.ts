import { Feriado } from '@/types';

// Função auxiliar para converter data DD/MM/YYYY para YYYY-MM-DD
function formatarData(data: string): string {
  const [dia, mes, ano] = data.split('/');
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

// Função auxiliar para converter nível do CSV para o tipo esperado
function formatarNivel(nivel: string): 'nacional' | 'estadual' | 'municipal' | 'facultativo' {
  switch (nivel.toUpperCase()) {
    case 'NACIONAL': return 'nacional';
    case 'ESTADUAL': return 'estadual';
    case 'MUNICIPAL': return 'municipal';
    case 'FACULTATIVO': return 'facultativo';
    default: return 'municipal';
  }
}
