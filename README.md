# 🏥 Sistema de Pré-Agendamento de Exames

Sistema web para **pré-agendamento de exames** do **Hospital Santa Cruz de Canoinhas (SC)**, desenvolvido como **Projeto de Extensão** do curso de Análise e Desenvolvimento de Sistemas (ADS) do **IFSC – Câmpus Canoinhas**.

O paciente solicita o exame pela internet, escolhendo o exame, para quem é (ele mesmo ou um dependente) e **até três opções de dia e horário**. A recepção do hospital analisa a solicitação e **confirma, recusa ou remarca**, e o paciente acompanha tudo pelo painel.

---

## 📑 Sumário

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Estrutura do repositório](#-estrutura-do-repositório)
- [Como executar](#-como-executar)
- [Usuários de teste](#-usuários-de-teste)
- [Endpoints da API](#-endpoints-da-api)
- [Regras de negócio](#-regras-de-negócio)
- [Testes](#-testes)
- [Documentação complementar](#-documentação-complementar)
- [Equipe](#-equipe)

---

## ✨ Funcionalidades

### 👤 Paciente
- Cadastro com endereço preenchido automaticamente pelo CEP (ViaCEP)
- Login por **e-mail ou CPF**
- Painel com contadores e próximos exames
- Perfil com dados cadastrais e troca de senha
- Cadastro de **dependentes** (filho, cônjuge, pai/mãe, outro) e agendamento para eles
- Solicitação de exame em **4 etapas**: exame → paciente → data/horário → confirmação
- Escolha de **1 a 3 opções** de dia e horário a partir da agenda real do hospital
- Consulta, reagendamento e cancelamento de solicitações

### 🧾 Recepção
- Dashboard com visão geral das solicitações
- **Confirmar, recusar, remarcar, concluir e cancelar** agendamentos
- Criar agendamentos e cadastrar pacientes direto no balcão
- Gerenciar a **agenda**: horário padrão de funcionamento e ajustes por dia (fechar um dia ou definir horário próprio)

### 🛡️ Administrador
- Tudo o que a recepção faz
- Gerenciar **usuários** (cargo, status, senha) e cadastrar recepcionistas
- Gerenciar o **catálogo de exames** (criar, editar, ativar/desativar, excluir)

---

## 🚀 Tecnologias

| Camada | Tecnologias |
|---|---|
| **Front-end** | React 19, Vite 8, JavaScript, CSS puro, Phosphor Icons, ESLint |
| **Back-end** | Java 21, Spring Boot 4, Spring Web MVC, Spring Data JPA, Spring Security, Bean Validation, Lombok |
| **Autenticação** | JWT (jjwt 0.12) + senhas com BCrypt |
| **Banco de dados** | PostgreSQL 16, migrations com Flyway |
| **Infra / Dev** | Maven Wrapper, Docker Compose |
| **Serviço externo** | [ViaCEP](https://viacep.com.br/) |

---

## 🧭 Arquitetura

```
┌──────────────────────┐   HTTP + JSON (JWT Bearer)   ┌──────────────────────────┐        ┌──────────────┐
│  Front-end (React)   │ ───────────────────────────▶ │  API REST (Spring Boot)  │ ─────▶ │  PostgreSQL  │
│  localhost:5173      │ ◀─────────────────────────── │  localhost:8080          │ ◀───── │  (Flyway)    │
└──────────────────────┘                              └──────────────────────────┘        └──────────────┘
          │
          └──▶ ViaCEP (preenchimento de endereço)
```

O back-end segue arquitetura em camadas: **Controller → Service → Repository → Entity**, com DTOs (Java Records) na entrada e saída da API e tratamento global de exceções em JSON padronizado.

---

## 📁 Estrutura do repositório

```
Projeto-de-Extens-o/
├── Sistema-de-Agendamento-Back/        # API REST (Spring Boot)
│   ├── src/main/java/com/hospital/agendamento_api/
│   │   ├── config/        # Segurança e CORS
│   │   ├── controller/    # Endpoints REST
│   │   ├── dto/           # Objetos de requisição/resposta
│   │   ├── entity/        # Entidades JPA
│   │   ├── exception/     # Exceções e handler global
│   │   ├── repository/    # Spring Data JPA
│   │   ├── runner/        # Seeders do ambiente de desenvolvimento
│   │   ├── security/      # Filtro e serviço de token JWT
│   │   └── service/       # Regras de negócio
│   ├── src/main/resources/db/migration/   # Migrations Flyway (V1 a V8)
│   ├── compose.yaml                       # PostgreSQL local
│   └── AGENDA-DISPONIBILIDADE.md          # Regras da agenda
│
└── Sistema-de-Agendamento-Front/       # Interface web (React + Vite)
    └── src/
        ├── components/    # Componentes reutilizáveis (calendário, header, layout admin...)
        ├── config/        # Dados do hospital e configurações de agendamento
        ├── hooks/         # Hooks de dados (agenda, agendamentos, admin)
        ├── pages/         # Telas: Home, Login, Cadastro, Painel, Perfil, NovoExame, ConsultarExames, Admin
        ├── services/      # Cliente HTTP, chamadas à API, sessão e ViaCEP
        └── utils/         # Máscaras, datas e utilitários
```

---

## ▶️ Como executar

### Pré-requisitos

| Ferramenta | Versão |
|---|---|
| Java (JDK) | 21 |
| Node.js | 20.19+ ou 22.12+ |
| Docker + Docker Compose | recente (para o banco local) |
| Git | — |

### 1. Clonar o repositório

```bash
git clone https://github.com/Tioski/Projeto-de-Extens-o.git
cd Projeto-de-Extens-o
```

### 2. Subir o banco de dados

```bash
cd Sistema-de-Agendamento-Back
docker compose up -d
```

Sobe um PostgreSQL 16 na porta `5432` com banco `agendamento_db`, usuário `postgres` e senha `teste123`.

### 3. Iniciar o back-end

Configure as variáveis de ambiente para apontar para o banco local:

```bash
# Linux / macOS
export DB_URL=jdbc:postgresql://localhost:5432/agendamento_db
export DB_USER=postgres
export DB_PASSWORD=teste123
export API_SECURITY_TOKEN_SECRET=uma-chave-secreta-com-pelo-menos-32-caracteres

./mvnw spring-boot:run
```

```powershell
# Windows (PowerShell)
$env:DB_URL="jdbc:postgresql://localhost:5432/agendamento_db"
$env:DB_USER="postgres"
$env:DB_PASSWORD="teste123"
$env:API_SECURITY_TOKEN_SECRET="uma-chave-secreta-com-pelo-menos-32-caracteres"

.\mvnw.cmd spring-boot:run
```

A API sobe em **http://localhost:8080**. Na primeira execução, o **Flyway** cria as tabelas e insere os dados iniciais (cargos e exames de exemplo).

| Variável | Descrição |
|---|---|
| `DB_URL` | URL JDBC do PostgreSQL |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `API_SECURITY_TOKEN_SECRET` | Chave de assinatura do JWT (mínimo 32 caracteres) |

### 4. Iniciar o front-end

Em outro terminal:

```bash
cd Sistema-de-Agendamento-Front
npm install
npm run dev
```

Acesse **http://localhost:5173**.

Se a API estiver em outro endereço, crie um `.env` a partir do exemplo:

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | URL base da API |
| `VITE_BACKEND_DATAS_OPCIONAIS` | `false` | Use `true` quando o back-end aceitar as datas 2 e 3 vazias |

> **CORS:** a API aceita requisições apenas de `http://localhost:*` e `http://127.0.0.1:*`. Ao hospedar o front, adicione o domínio em `SecurityConfig.corsConfigurationSource()`.

### Scripts do front-end

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | Verifica o código com ESLint |

---

## 🔑 Usuários de teste

Com o perfil `dev` ativo (padrão), a API cria automaticamente:

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@hospital.com` | `admin123` |
| Recepcionista | `recepcao@hospital.com` | `recepcao123` |

Pacientes são criados pela tela **Entrar → Criar conta**.

> ⚠️ Essas credenciais são apenas para desenvolvimento. Não use o perfil `dev` em produção.

---

## 🔌 Endpoints da API

Todas as rotas, exceto login e cadastro, exigem o header `Authorization: Bearer <token>`.

| Grupo | Rota base | Acesso | Principais operações |
|---|---|---|---|
| Autenticação | `/api/auth` | Público | `POST /login` |
| Usuários | `/api/usuarios` | Público (cadastro) / Logado | Cadastro, `GET/PUT /me`, `PATCH /me/senha` |
| Exames | `/api/exames` | Logado | Listar exames ativos |
| Pacientes | `/api/pacientes` | Logado | Meus pacientes, CRUD de dependentes |
| Agenda | `/api/agenda` | Logado | Dias disponíveis e horários livres por dia |
| Agendamentos | `/api/agendamentos` | Logado | Solicitar, listar os meus, reagendar, cancelar |
| Recepção – agendamentos | `/api/recepcao/agendamentos` | Recepção / Admin | Listar, criar, confirmar, recusar, remarcar, concluir, cancelar |
| Recepção – agenda | `/api/recepcao/agenda` | Recepção / Admin | Padrão de funcionamento e ajustes por dia |
| Recepção – pacientes | `/api/recepcao/pacientes` | Recepção / Admin | Buscar e cadastrar pacientes |
| Recepção – exames | `/api/recepcao/exames` | Recepção / Admin | Cadastrar exame |
| Admin – usuários | `/api/admin/usuarios` | Admin | Listar, editar, cargo, status, senha, criar recepcionista |
| Admin – exames | `/api/admin/exames` | Admin | CRUD e ativação de exames |

Erros são retornados em JSON padronizado:

```json
{
  "timestamp": "2026-11-26T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Descrição do erro."
}
```

---

## 📋 Regras de negócio

- **Status da solicitação:** `PENDENTE` → `CONFIRMADO` / `RECUSADO` → `CONCLUIDO`, ou `CANCELADO`.
- Só pode existir **uma solicitação pendente por paciente e exame**.
- **Agenda:** por padrão funciona todos os dias, das 06:30 às 21:00, com horários a cada 30 minutos. A recepção pode fechar dias ou definir horários próprios.
- Um horário **confirmado ou concluído fica bloqueado** para outros pacientes. Cancelar, recusar ou remarcar libera o horário.
- Um horário só é válido se o dia estiver aberto, estiver dentro da grade, for futuro e estiver livre.
- Datas e horas são sempre interpretadas no fuso `America/Sao_Paulo`.
- Parentesco de dependente: `FILHO`, `CONJUGE`, `PAI_MAE` ou `OUTRO` (`TITULAR` é criado automaticamente no cadastro).

---

## ✅ Testes

```bash
cd Sistema-de-Agendamento-Back
./mvnw test
```

Inclui testes unitários das regras da agenda (`RegrasAgendaTest`).

---

## 📚 Documentação complementar

- [`Sistema-de-Agendamento-Back/AGENDA-DISPONIBILIDADE.md`](Sistema-de-Agendamento-Back/AGENDA-DISPONIBILIDADE.md): funcionamento detalhado da agenda e bloqueio de horários
- [`Sistema-de-Agendamento-Back/README.md`](Sistema-de-Agendamento-Back/README.md): relatório técnico do back-end
- [`Sistema-de-Agendamento-Front/README.md`](Sistema-de-Agendamento-Front/README.md): detalhes do front-end e da integração com a API

---

## 👥 Equipe

Projeto de Extensão – ADS – IFSC Câmpus Canoinhas, em parceria com o Hospital Santa Cruz de Canoinhas.

| Nome | Função | GitHub |
|---|---|---|
| _Nome_ | _Back-end / Front-end / ..._ | [@usuario](https://github.com/usuario) |
| _Nome_ | _..._ | [@usuario](https://github.com/usuario) |

**Orientação:** _Nome do(a) professor(a)_
