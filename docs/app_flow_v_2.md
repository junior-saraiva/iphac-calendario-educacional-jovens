## App Flow, Pages & Roles

### 🗺️ Mapa do Site
- Login
- Painel principal
- Alunos (CRUD)
- Trilhas e disciplinas (CRUD)
- Feriados (CRUD + importação)
- Geração de calendário (por CPF ou matrícula)
- Consulta e download de PDFs

---

### 🎯 Finalidade de Cada Página
- **Login:** acesso seguro por perfil
- **Painel principal:** atalhos rápidos
- **Alunos:** cadastro completo com dia fixo da aula teórica
- **Trilhas:** organização por tipo (introdutória, específica, etc.)
- **Feriados:** importar de API + edição manual
- **Calendário:** geração automática e visualização mensal
- **Consulta:** histórico de PDFs por aluno

---

### 👥 Perfis de Usuário
- **Administrador:** total acesso, configurações e edição de feriados
- **Operador:** CRUD + geração e consulta de calendários
- **Consulta:** apenas leitura e download de PDFs

---

### 🛤️ Jornadas Principais

#### 1. Cadastro completo de aluno
- Preencher dados pessoais + curso, turma, empresa
- Selecionar o dia fixo da aula teórica (ex: quarta-feira)
- Salvar para uso em geração automática

#### 2. Geração de calendário individual
- Buscar por CPF ou RA
- Aplicar regras para módulo 1, práticas e aulas teóricas
- Inserir férias manualmente
- Gerar e salvar PDF com visual mensal e legenda

#### 3. Reemissão de calendário
- Buscar aluno
- Exibir versões anteriores
- Baixar PDF

#### 4. Atualização de feriados
- Importar de API (ex: joaopbini)
- Validar e editar conforme necessidade
- Nova geração aplica calendário atualizado

