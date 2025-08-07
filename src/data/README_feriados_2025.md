# 📅 Feriados 2025 - Estrutura Modular em TypeScript

Este módulo contém todos os feriados do ano de 2025, organizados em múltiplas categorias e otimizados para uso com TypeScript, Supabase, Lovable ou projetos front-end customizados.

---

## 📂 Estrutura de Arquivos

```bash
feriados_utils.ts                        # Funções auxiliares (formatarData, formatarNivel)
feriados_nacionais_2025.ts              # Feriados nacionais
feriados_estaduais_2025.ts              # Feriados estaduais (ex: AC)
feriados_facultativos_2025.ts           # Feriados e pontos facultativos
feriados_municipais_2025_parte1.ts      # Feriados municipais (parte 1)
feriados_municipais_2025_parte2.ts      # Feriados municipais (parte 2)
feriados_municipais_2025_parte3.ts      # Feriados municipais (parte 3)
index_feriados_municipais_2025.ts       # Junta as 3 partes em `feriadosMunicipais2025`
index_feriados_reais_combinados_2025.ts # Junta tudo em `feriadosReaisCombinados`
```

---

## ✅ Como usar

### 1. Importe as funções auxiliares

```ts
import { formatarData, formatarNivel } from './feriados_utils';
```

### 2. Importe os conjuntos de feriados

```ts
import { feriadosNacionais2025 } from './feriados_nacionais_2025';
import { feriadosEstaduais2025 } from './feriados_estaduais_2025';
import { feriadosFacultativos2025 } from './feriados_facultativos_2025';
import { feriadosMunicipais2025 } from './index_feriados_municipais_2025';
```

### 3. Para carregar **todos os feriados juntos**:

```ts
import { feriadosReaisCombinados } from './index_feriados_reais_combinados_2025';
```

---

## 📌 Tipo utilizado

Todos os dados seguem o tipo:

```ts
type Feriado = {
  id: string;
  data: string;         // formato YYYY-MM-DD
  descricao: string;    // nome + cidade/estado
  nivel: 'nacional' | 'estadual' | 'municipal' | 'facultativo';
};
```

---

## ✨ Sugestão de uso com Supabase ou Lovable

Você pode popular uma tabela `feriados` ou alimentar fluxos de calendários dinâmicos com base nessas constantes já normalizadas.

---

Desenvolvido com 💼 para projetos que exigem precisão, organização e integração escalável.