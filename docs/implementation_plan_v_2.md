## Implementation Plan

### 📕 Etapas do Desenvolvimento

1. **Setup do projeto**
   - Iniciar repositórios Git (frontend e backend)
   - Configurar banco de dados PostgreSQL
   - Definir modelo de dados inicial (ERD refinado)

2. **Módulo de Alunos**
   - CRUD: nome, CPF, RA, turma, curso, turno, empresa, dia da semana da aula teórica
   - Validação de dados (ex: CPF válido, seleção de dia obrigatório)

3. **Módulo de Trilhas e Disciplinas**
   - Cadastro de trilhas e respectivas disciplinas
   - Registro de tipo (ex: integração, específica) e carga horária
   - Registro das datas específicas por trilha/curso

4. **Regras Automatizadas de Calendário**
   - **Módulo 1**: gerar automaticamente 10 dias corridos
     - Se houver feriado no intervalo, estender automaticamente
   - **Demais módulos**:
     - Usar o campo "dia da semana" para gerar sessões teóricas semanais
     - Atribuir 4 dias úteis restantes à prática na empresa
     - Omitir sessões teóricas em dias de feriado
   - **Férias**: gerar bloco de 30 dias corridos, iniciando em data definida manualmente pelo RH

5. **Importação de Feriados**
   - Integração com API externa (ex: joaopbini/feriados-brasil, Invertexto, RapidAPI)
   - Interface para CRUD manual (edição de feriados específicos)

6. **Geração de PDF**
   - Template mensal visual colorido, com legenda (aula teórica, prática, feriado, férias)
   - Preenchimento dinâmico por aluno conforme regras e trilhas
   - Exportação e armazenamento em banco

7. **Busca e Consulta**
   - Busca por CPF ou RA
   - Reexibição do calendário e download de PDF

8. **Autenticação e Perfis de Acesso**
   - Login para administradores e operadores
   - Controle de permissões por perfil

9. **Refinamento Visual + QA**
   - Ajustes finos no layout do PDF
   - Testes com dados reais de diferentes matrículas e turmas

---

### 🌐 API & Importação de Feriados

- **Fonte principal:** repositório GitHub [joaopbini/feriados-brasil](https://github.com/joaopbini/feriados-brasil), que fornece feriados nacionais, estaduais e municipais organizados por ano e localidade.
- **Formato dos dados:** JSON/CSV estruturado, com suporte a pontos facultativos.
- **Cobertura:** alta para grandes cidades e capitais; precisa de validação para municípios menores.
- **Complemento (fallback):** uso de APIs como [Invertexto](https://api.invertexto.com) ou [RapidAPI - Feriados Brasileiros](https://rapidapi.com/davidsimonmarques/api/feriados-brasileiros) para garantir atualizações e cobertura completa.
- **Importação e manutenção:** sistema deve permitir importação manual e visualização/editável via CRUD, com indicação de origem (API, arquivo, manual).

### ⏱️ Linha do Tempo

- Semana 1: Setup, Alunos e Trilhas
- Semana 2: Feriados + Regras de Geração de Calendário
- Semana 3: Geração de PDF + Consulta + Login
- Semana 4: Testes + Ajustes + Entrega

---

### 👨‍💼 Papéis e Rituais

- **Líder de Produto:** validação de regras, datas de férias, testes visuais
- **Desenvolvedor Backend:** API, banco, geração automática de datas, PDF
- **Dev Frontend:** CRUD, busca, login, visualização de calendário
- **Teste quinzenal:** rodar 3 usuários com cenários reais (com e sem feriados)

---

### ✨ Integrações e Extras

- **Brasil.io ou Calendário IBGE** para feriados nacionais e regionais
- **Stretch goals:**
  - Exportar todos os calendários de uma turma
  - Geração em lote por filtro (curso, mês, trilha)
  - Dashboard com carga horária aplicada vs prevista

