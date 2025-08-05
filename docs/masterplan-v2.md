## Masterplan

### 📈 Regras de Negócio

- **Módulo 1 (Trilha Introdutória):**
  - Sempre com duração de 10 dias corridos.
  - Se houver feriado durante esse período, o módulo é estendido proporcionalmente.

- **Demais módulos (Específico, Profissional, Empregabilidade):**
  - 1 dia fixo por semana de aula teórica.
  - 4 dias por semana são destinados à atividade prática em empresa parceira.

- **Férias obrigatórias:**
  - Cada calendário deve conter um bloco de 30 dias corridos de férias.
  - A data inicial deve ser definida manualmente pelo RH no momento da geração.

- **Dia fixo de aula teórica:**
  - No momento do cadastro do aluno, deve ser definido qual dia da semana será utilizado para as aulas teóricas.
  - Esse dia será usado automaticamente para gerar todas as sessões teóricas do contrato (exceto quando houver feriado, quando a aula é suprimida ou compensada).

---

### ✨ Elevator Pitch

Gere calendários personalizados em PDF para Jovens Aprendizes, com base em disciplinas, datas, e carga horária, levando em conta feriados nacionais, estaduais e municipais.

---

### 🧭 Problema & Missão

- **Problema:** Elaborar calendários de curso manualmente é demorado, sujeito a erros e dificulta o controle.
- **Missão:** Automatizar a geração e armazenamento de calendários educacionais personalizados, prontos para PDF e consulta futura.

---

### 🎯 Audiência-alvo

- Instituições de aprendizagem profissional
- Coordenadores de cursos e RH de empresas parceiras
- Jovens Aprendizes e seus responsáveis

---

### 🔧 Funcionalidades Principais

- Cadastro e edição de:
  - Alunos (CPF, RA, turma, etc)
  - Disciplinas e trilhas (nome, carga horária, datas)
  - Datas de férias e feriados (com importador automático)
- Geração de PDF individual por aluno com layout mensal colorido
- Repositório interno de calendários gerados
- Busca por CPF ou RA para reconsulta

---

### 🛠️ Stack Tecnológico

- **Frontend:** React (SPA responsiva, fluida)
- **Backend:** Node.js + Express (API REST)
- **Banco de Dados:** PostgreSQL (relacional, ideal para CRUDs e joins)
- **Geração de PDF:** Puppeteer ou PDFKit (visual fiel ao modelo)
- **Feriados:** API Brasil.io ou Calendário IBGE

---

### 🖊️ Modelo de Dados (ERD refinado)

- `Aluno (id, nome, cpf, matricula, turma_id, empresa_id, curso, turno, dia_aula_semana)`
- `Empresa (id, nome, cnpj, cidade, estado)`
- `Turma (id, nome, matriz, carga_horaria_total)`
- `Trilha (id, nome, codigo, tipo [integração|específica|profissional|empregabilidade], turma_id)`
- `Disciplina (id, trilha_id, nome, carga_horaria, dias_aula[])`
- `Pratica (id, aluno_id, dias_pratica[])`
- `Feriado (id, data, descricao, nivel [nacional|estadual|municipal])`
- `CalendarioPDF (id, aluno_id, caminho_arquivo, data_geracao)`

---

### 🎨 Princípios de UI

- Calendário gerado deve ser:
  - **Mensal**, estilo grade, com **cores distintas** para cada módulo
  - Com **legenda visual clara** (ex: aula teórica, prática, feriado, férias)
  - Layout inspirado no modelo do IPHAC

---

### 🔐 Segurança & Compliance

- Dados pessoais (CPF, RA) criptografados em banco
- Acesso com autenticação e permissões (admin, consulta, edição)
- Geração de PDF com proteção contra edição

---

### 🗺️ Roadmap por Fase

- **MVP:** CRUD + Geração de PDF + Importação de feriados nacionais
- **V1:** Feriados estaduais e municipais + Autenticação de usuários + Layout refinado
- **V2:** Notificações, exportação em lote, relatório de carga horária

---

### ⚠️ Riscos e Mitigações

- **Datas em excesso por aluno:** limitar por regra de carga horária máxima
- **Feriados imprecisos:** validação manual ou API com fallback
- **PDF com erros visuais:** testes com casos reais + modelo fixo

---

### 🚀 Expansão Futura

- Portal do aluno com login e visualização do calendário
- Integração com sistemas de folha/RH
- Dashboard de presença e conclusão por trilha
