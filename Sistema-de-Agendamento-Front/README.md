# Sistema de Pré-Agendamento de Exames

O sistema permite que pacientes solicitem o pré-agendamento de exames de forma digital — escolhendo o exame, o paciente e até três opções de data e horário — e acompanhem o andamento das solicitações. A equipe do hospital confirma uma das datas sugeridas.

---

## Sumário

1. [Sobre o projeto](#-sobre-o-projeto)
2. [Tecnologias](#-tecnologias)
3. [Visão geral da arquitetura](#-visão-geral-da-arquitetura)
4. [Como executar](#-como-executar)
5. [Estrutura do projeto](#-estrutura-do-projeto)
6. [Como o front-end funciona](#-como-o-front-end-funciona)
7. [Integração com a API](#-integração-com-a-api)
8. [Regras de negócio que afetam o front](#-regras-de-negócio-que-afetam-o-front)
9. [Back-end em resumo](#-back-end-em-resumo)
10. [Como contribuir](#-como-contribuir)
11. [Qualidade e testes](#-qualidade-e-testes)
12. [Problemas conhecidos e pendências](#-problemas-conhecidos-e-pendências)

---

## 📌 Sobre o projeto

O sistema está sendo desenvolvido a partir das necessidades identificadas junto ao Hospital de Canoinhas.

### Funcionalidades disponíveis hoje

| Funcionalidade | Situação |
|---|---|
| Criar conta (com endereço, preenchido automaticamente pelo CEP) | ✅ Implementada |
| Login por **e-mail ou CPF** | ✅ Implementada |
| Painel do paciente (contadores e próximos exames) | ✅ Implementada |
| **Perfil** com todos os dados cadastrados | ✅ Implementada |
| Solicitar novo exame em **4 etapas** com barra de progresso (exame → paciente → data e horário → confirmação) | ✅ Implementada |
| Escolher de **1 a 3** opções de **dia no calendário + horário livre** (mesma agenda do painel do admin; só a 1ª é obrigatória) + observação | ✅ Implementada |
| Cadastrar dependentes (filho, cônjuge, pai/mãe, outro) e agendar para eles | ✅ Implementada |
| Consultar solicitações, ver status e datas sugeridas | ✅ Implementada |
| Cancelar uma solicitação | ✅ Implementada |
| Confirmar/recusar solicitações pela equipe do hospital (recepção) | ⏳ **Não existe** no back nem no front |
| Área do médico | ⏳ Prevista no banco de dados, sem endpoints |

> **Importante:** o paciente **sugere de uma a três datas** e a recepção confirma uma delas (veja [Datas opcionais](#datas-opcionais-e-o-back-end)). Enquanto isso, a solicitação fica com status `PENDENTE`. Como o fluxo da recepção ainda não existe, hoje toda solicitação permanece `PENDENTE` (ou `CANCELADO`, se o paciente cancelar).

### O que cada tipo de visitante vê

- **Visitante (sem login):** a navegação mostra apenas **Início** e **Entrar**. Da tela de login é possível ir para o cadastro.
- **Usuário logado:** a navegação mostra **Início, Agendar Exame, Consultar Exames, Painel, Perfil** e **Sair**. No **Perfil** ficam os dados do cadastro, os pacientes vinculados (titular e dependentes) e botões de atalho para agendar e consultar exames.

---

## 🚀 Tecnologias

### Front-end (este repositório)

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Interface |
| Vite | 8 | Servidor de desenvolvimento e build |
| JavaScript (ESM) + JSX | — | Linguagem |
| CSS puro | — | Estilos (um `.css` por componente/página, variáveis em `index.css`) |
| ESLint | 10 | Qualidade de código |
| Phosphor Icons (`@phosphor-icons/react`) | 2 | Ícones da área do paciente (header, serviços rápidos, olhinho da senha) |

Fora a biblioteca de ícones, não há bibliotecas de roteamento, estado global, formulários ou requisições (nem React Router, Redux ou Axios). Tudo usa React + `fetch` do navegador.

### Back-end ([repositório próprio](https://github.com/Lucas-Eduardo-Karvat/Sistema-de-Agendamento))

- Java 21 e Spring Boot 4.1 (Web, Data JPA, Validation, Security)
- JWT (biblioteca `jjwt`) para autenticação e BCrypt para senhas
- Flyway para versionar o banco

### Banco de dados

- PostgreSQL 16 (local via Docker, ou hospedado no Neon)
- DBeaver para consultas manuais

### Serviço externo

- [ViaCEP](https://viacep.com.br) — consulta pública e gratuita usada **direto pelo navegador** para preencher o endereço a partir do CEP. Não passa pelo nosso back-end.

---

## 🧭 Visão geral da arquitetura

```
┌──────────────────────┐   JSON + JWT (Bearer)   ┌────────────────────────┐        ┌──────────────┐
│  Front-end (este repo)│ ──────────────────────▶ │  Back-end Spring Boot   │ ─────▶ │  PostgreSQL  │
│  React + Vite         │ ◀────────────────────── │  http://localhost:8080  │ ◀───── │  (Flyway)    │
│  http://localhost:5173│                         └────────────────────────┘        └──────────────┘
└──────────┬───────────┘
           │  GET /ws/{cep}/json  (só no cadastro)
           ▼
     ViaCEP (externo)
```

- O front guarda o **token JWT** no `localStorage` depois do login e o envia em todas as rotas protegidas.
- **A senha nunca é criptografada no front.** Ela viaja no corpo da requisição de login/cadastro e é transformada em hash BCrypt pelo back-end. Por isso, **em produção o uso de HTTPS é obrigatório**.

---

## ▶ Como executar

### Pré-requisitos

| Ferramenta | Versão | Para quê |
|---|---|---|
| Node.js | **20.19+ ou 22.12+** (exigência do Vite 8) | Front-end |
| npm | acompanha o Node | Front-end |
| Java (JDK) | **21** | Back-end |
| Docker + Docker Compose | qualquer versão recente | Subir o PostgreSQL local (opcional se usar o Neon) |
| Git | — | Clonar os repositórios |

Verifique com `node -v`, `java -version` e `docker --version`.

### Passo 1 — Clonar os repositórios

```bash
git clone <url-deste-repositorio>          # front-end
git clone https://github.com/Lucas-Eduardo-Karvat/Sistema-de-Agendamento.git   # back-end
```

> O back-end usa a branch `lucas` no momento. Confirme com o responsável qual branch deve ser usada: `git checkout lucas`.

### Passo 2 — Subir o banco de dados

**Opção A — PostgreSQL local com Docker (recomendado para desenvolvimento)**

Dentro da pasta do back-end (`Sistema-de-Agendamento`):

```bash
docker compose up -d
```

Isso sobe um PostgreSQL 16 na porta `5432` com banco `agendamento_db`, usuário `postgres` e senha `teste123` (definidos em `compose.yaml`).

> O back-end está com `spring.docker.compose.enabled=false`, então **ele não sobe o banco sozinho** — execute o comando acima antes de iniciar a API.

**Opção B — Neon (PostgreSQL na nuvem)**

Não precisa do Docker. Defina as variáveis de ambiente da tabela abaixo apontando para o banco do Neon antes de iniciar o back-end. O Neon exige conexão segura, então termine a URL com `?sslmode=require`, por exemplo `DB_URL=jdbc:postgresql://<host-do-neon>/<banco>?sslmode=require`.

### Passo 3 — Iniciar o back-end

Dentro de `Sistema-de-Agendamento`:

```bash
# Linux / macOS (na primeira vez: chmod +x mvnw)
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

- A API sobe em **http://localhost:8080**.
- Na primeira execução o **Flyway cria as tabelas automaticamente** e insere os dados iniciais: o cargo `PACIENTE` e três exames de exemplo (Hemograma Completo, Raio-X de Tórax e Ultrassonografia Abdominal).
- Se a API não iniciar, confira se o PostgreSQL está rodando e se as credenciais conferem.

**Variáveis de ambiente do back-end** (todas têm valor padrão para desenvolvimento local):

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/agendamento_db` | URL JDBC do banco |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `teste123` | Senha do banco |
| `API_SECURITY_TOKEN_SECRET` | valor de exemplo no código | Chave de assinatura do JWT (**mínimo 32 caracteres; troque em produção**) |

### Passo 4 — Iniciar o front-end

Dentro da pasta deste repositório:

```bash
npm install
npm run dev
```

Abra **http://localhost:5173**.

Opcionalmente, se o back-end não estiver em `http://localhost:8080`, crie um arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
# edite VITE_API_URL=http://seu-servidor:porta
```

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_BACKEND_DATAS_OPCIONAIS` | `false` | `true` quando o back-end já aceita `dataOpcao2`/`dataOpcao3` nulas (veja [Datas opcionais](#datas-opcionais-e-o-back-end)). |
| `VITE_API_URL` | `http://localhost:8080` | URL base da API (sem barra no final). É lida **na hora do build/start**: reinicie o `npm run dev` depois de alterar. |

> **CORS:** o back-end só aceita requisições vindas de `http://localhost:*` e `http://127.0.0.1:*`. Rode o front por um desses endereços. Quando o sistema for hospedado, o domínio do front precisa ser adicionado em `SecurityConfig.corsConfigurationSource()` no back-end.

### Passo 5 — Primeiro acesso

Não existe usuário pré-cadastrado. Na tela inicial clique em **Entrar → Criar conta**, preencha o formulário e você será logado automaticamente. O cadastro sempre cria um usuário com o cargo `PACIENTE`.

### Scripts do front-end

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática (porta 5173) |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve o conteúdo de `dist/` localmente (porta 4173) para conferir o build |
| `npm run lint` | Executa o ESLint em todo o projeto |

---

## 📁 Estrutura do projeto

```
Projeto-de-Extens-o/
├── index.html                 # Ponto de entrada do Vite
├── vite.config.js
├── eslint.config.js
├── package.json
├── .env.example               # Modelo das variáveis de ambiente (VITE_API_URL)
├── public/
│   └── hospital.jpg           # Foto da fachada exibida na página inicial (Hero)
└── src/
    ├── main.jsx               # Monta o <App /> (StrictMode)
    ├── App.jsx                # "Roteador": controla a página atual, a sessão e a proteção de rotas
    ├── App.css / index.css    # Estilos globais, variáveis de cor/tipografia e classes reutilizáveis
    ├── Footer.jsx / Footer.css
    │
    ├── components/            # Peças reutilizáveis
    │   ├── CampoSenha.jsx     # Campo de senha com o "olhinho" para mostrar/ocultar (login, cadastro, perfil)
    │   ├── ErrorBoundary.jsx  # Rede de segurança: erro inesperado mostra aviso em vez de tela branca
    │   ├── Header.jsx         # Navegação (muda conforme o usuário está logado ou não)
    │   ├── Hero.jsx           # Banner da página inicial
    │   └── Info.jsx           # Bloco informativo da página inicial
    │
    ├── pages/                 # Uma pasta por tela
    │   ├── Home/              # Página inicial (+ resumo real do usuário quando logado)
    │   ├── Login/             # Login por e-mail ou CPF
    │   ├── Cadastro/          # Criação de conta + busca de endereço por CEP
    │   ├── Painel/            # Contadores e próximos exames
    │   ├── Perfil/            # Dados cadastrados, pacientes vinculados e atalhos
    │   ├── NovoExame/         # Assistente de agendamento em 4 etapas
    │   │   ├── NovoExame.jsx          # Container: estado, validações e envio
    │   │   ├── ProgressoEtapas.jsx    # Os 4 passos + barra de progresso
    │   │   └── etapas/                # Uma tela por etapa: EtapaExame, EtapaPaciente (+ dependente), EtapaDataHorario, EtapaConfirmacao
    │   └── ConsultarExames/   # Lista, busca e cancelamento de solicitações
    │
    ├── config/
    │   └── agendamento.js     # Flag das datas opcionais e limite do campo de data
    │
    ├── services/              # Comunicação com o "mundo externo"
    │   ├── http.js            # Wrapper do fetch: token, timeout, erros padronizados
    │   ├── api.js             # Funções de cada endpoint do back-end
    │   ├── session.js         # Sessão no localStorage (token + dados do usuário)
    │   └── viacep.js          # Consulta de CEP no ViaCEP
    │
    ├── hooks/
    │   └── useAgendamentos.js # Carrega agendamentos + exames + pacientes do usuário logado
    │
    └── utils/
        ├── agendamento.js     # Status, formatação de datas, validações de formulário, parentescos
        ├── datas.js           # Leitura segura de datetime-local, validação das opções de data, payload da API
        └── mascaras.js        # Máscaras de CPF/telefone/CEP e formatadores de exibição
```

> A área do administrador/recepção (`src/pages/Admin/` e arquivos `admin`) é independente da área do paciente descrita aqui.

---

## 🧠 Como o front-end funciona

### Navegação (sem React Router)

`App.jsx` guarda a página atual em um estado (`currentPage`) e renderiza o componente correspondente com um `switch`. As páginas recebem a função `onNavigate('nome-da-pagina')` para trocar de tela.

| Chave da página | Tela | Exige login? |
|---|---|---|
| `home` | Início | Não |
| `login` | Login | Não |
| `cadastro` | Cadastro | Não |
| `painel` | Painel do paciente | **Sim** |
| `novo-exame` | Solicitar exame | **Sim** |
| `consultar-exames` | Minhas solicitações | **Sim** |
| `perfil` | Perfil | **Sim** |

- As páginas protegidas estão listadas em `PAGINAS_PROTEGIDAS` (`App.jsx`). Sem sessão, o usuário é enviado ao login e, **depois de entrar, volta para a página que tentou abrir**.
- A URL do navegador **não muda** ao navegar (sempre `/`). Consequência: o botão "voltar" do navegador não navega entre telas e não é possível compartilhar o link de uma tela. Migrar para React Router é uma melhoria possível.

### Sessão e autenticação

1. `POST /api/auth/login` devolve `{ token, tipo, usuarioPublicId, nome, cargo }`.
2. `session.js` salva isso no `localStorage` na chave `agendamento.session`.
3. `http.js` anexa `Authorization: Bearer <token>` em toda requisição autenticada.
4. O token dura **24 horas** (definido no back-end). O front lê o campo `exp` do JWT e **descarta a sessão vencida** ao carregar, sem chamar a API.
5. Se a API responder **401** em uma rota protegida, `http.js` limpa a sessão e dispara o evento `auth:expired`; o `App` ouve esse evento e leva o usuário ao login.
6. **Sair** apaga a sessão do `localStorage`.

Não há *refresh token* nem endpoint de "usuário atual"; para carregar o perfil o front usa `GET /api/usuarios/{usuarioPublicId}`.

### Camada de API (`services/`)

- **`http.js` → `request(path, { method, body, auth })`**: único lugar que chama `fetch` para o nosso back-end. Cuida de cabeçalhos, token, timeout de 15 s e tradução de erros.
- **`api.js`**: um objeto por recurso (`authApi`, `usuarioApi`, `exameApi`, `pacienteApi`, `agendamentoApi`). As telas **nunca** chamam `fetch` diretamente; usam essas funções.
- **Erros:** qualquer falha vira um `ApiError` com `message` (texto pronto para exibir) e `status`. Quando o back responde `{ message }`, esse texto é usado; senão há mensagens padrão por status (401, 403, 404, 500). Falha de rede mostra "Não foi possível conectar ao servidor…".

### Formulários, máscaras e validação

- **Máscaras de digitação** (`utils/mascaras.js`): CPF (`000.000.000-00`), telefone (`(47) 99999-9999` ou `(47) 3333-4444`) e CEP (`00000-000`). Aplicadas no cadastro e no CPF do dependente. **O campo de login não tem máscara**, pois aceita e-mail.
- **O que vai para a API é sempre "limpo"**: CPF, telefone e CEP são enviados **só com dígitos**. A formatação é apenas visual (o Perfil formata novamente na exibição).
- **Validações no cliente** (`utils/agendamento.js`) espelham os DTOs do back-end: CPF com 11 dígitos, CEP com 8, UF com 2 letras, nascimento no passado, senha com mínimo de 6 caracteres, a 1ª data obrigatória e, se informadas, a 2ª e a 3ª futuras **e diferentes entre si** (`utils/datas.js`). Isso evita chamadas que o back-end responderia com erro. O back-end continua sendo a validação final.
- **Busca por CEP** (`services/viacep.js` + `Cadastro.jsx`): ao completar 8 dígitos, preenche logradouro, bairro, cidade e UF e leva o foco para "Número". Os campos continuam editáveis; CEP inexistente ou ViaCEP fora do ar apenas exibem uma mensagem e o formulário segue funcionando. Consultas antigas são canceladas se o CEP mudar.

### Estilos

- Variáveis de cor, tipografia, espaçamento e sombras em `:root` no `src/index.css` (ex.: `--color-primary`). **Use as variáveis em vez de cores fixas.**
- Classes reutilizáveis globais: `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.alert-error`, `.status-badge`, `.field`, `.page-shell`, `.container` etc.
- Cada página/componente tem seu `.css`. Como o Vite junta todo o CSS em um único arquivo, os estilos são globais — evite nomes de classe genéricos demais.

---

## 🔌 Integração com a API

**Base URL (local):** `http://localhost:8080` · **Formato:** JSON · **Autenticação:** `Authorization: Bearer <token>`

### Endpoints

| Método | Rota | Auth | Descrição | Função no front |
|---|---|---|---|---|
| POST | `/api/auth/login` | Não | Login (e-mail ou CPF) | `authApi.login` |
| POST | `/api/usuarios` | Não | Cadastro de paciente | `usuarioApi.cadastrar` |
| GET | `/api/usuarios/{publicId}` | Sim | Dados de um usuário | `usuarioApi.buscarPorPublicId` |
| GET | `/api/usuarios` | Sim | Lista todos os usuários | `usuarioApi.listarTodos` (não usado pelas telas) |
| GET | `/api/exames` | Sim | Exames ativos | `exameApi.listar` |
| GET | `/api/pacientes/meus-pacientes` | Sim | Titular + dependentes do usuário logado | `pacienteApi.listarMeus` |
| POST | `/api/pacientes/dependentes` | Sim | Cadastra dependente | `pacienteApi.cadastrarDependente` |
| POST | `/api/agendamentos` | Sim | Cria solicitação de agendamento | `agendamentoApi.criar` |
| GET | `/api/agendamentos/meus-agendamentos` | Sim | Solicitações do usuário logado | `agendamentoApi.listarMeus` |
| GET | `/api/agendamentos/{publicId}` | Sim | Detalhe de uma solicitação | `agendamentoApi.buscarPorPublicId` |
| PATCH | `/api/agendamentos/{publicId}/cancelar` | Sim | Cancela uma solicitação | `agendamentoApi.cancelar` |

Todos os identificadores expostos (`publicId`, `examePublicId`, `pacientePublicId`…) são **UUIDs**. O `id` numérico do banco nunca sai da API.

### Exemplos de payloads

**Login** — `POST /api/auth/login`
```json
{ "login": "maria@email.com", "senha": "segredo1" }
```
`login` aceita e-mail ou CPF **só com números**. Resposta `200`:
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "tipo": "Bearer",
  "usuarioPublicId": "f8a9271d-6055-4588-9a69-d84bce833030",
  "nome": "Maria Teste",
  "cargo": "PACIENTE"
}
```

**Cadastro** — `POST /api/usuarios` (resposta `201`, **sem token**: o front faz o login em seguida)
```json
{
  "nome": "Maria Teste",
  "cpf": "12345678909",
  "email": "maria@email.com",
  "senha": "segredo1",
  "telefone": "47999999999",
  "dataNascimento": "1990-05-10",
  "endereco": {
    "cep": "89466210",
    "logradouro": "Rua Exemplo",
    "numero": "145",
    "complemento": "Apto 2",
    "bairro": "Centro",
    "cidade": "Canoinhas",
    "estado": "SC"
  }
}
```
O cadastro cria automaticamente o **paciente titular** do usuário.

**Dependente** — `POST /api/pacientes/dependentes`
```json
{ "nome": "João", "cpf": null, "dataNascimento": "2018-03-04", "parentesco": "FILHO", "convenio": null }
```

**Nova solicitação** — `POST /api/agendamentos`
```json
{
  "pacientePublicId": null,
  "examePublicId": "uuid-do-exame",
  "dataOpcao1": "2026-11-10T12:00:00.000Z",
  "dataOpcao2": "2026-11-11T12:00:00.000Z",
  "dataOpcao3": "2026-11-12T12:00:00.000Z",
  "observacao": "Prefiro de manhã"
}
```
`pacientePublicId: null` = o próprio titular. As datas são `OffsetDateTime` ISO-8601 (o front converte o valor do `datetime-local` com `dataHoraParaIso` em `utils/datas.js`).

### Datas opcionais e o back-end

No front, o paciente informa de **1 a 3** datas. O back-end atual, porém, ainda exige as três (`@NotNull` nos DTOs e colunas `NOT NULL`). Por isso existe a flag `VITE_BACKEND_DATAS_OPCIONAIS`:

| Flag | O que o front envia | Quando usar |
|---|---|---|
| `false` (padrão) | As datas que faltam **repetem a última informada** (1 data → `[a, a, a]`; 2 datas → `[a, b, b]`) | Enquanto o back-end exigir as três. A recepção vê datas repetidas. |
| `true` | As datas que faltam vão como `null` | Depois que o back-end for ajustado. |

Ajustes necessários no back-end para ligar a flag: remover `@NotNull` de `dataOpcao2`/`dataOpcao3` em `AgendamentoRequestDTO` e `ReagendarAgendamentoRequestDTO`; tornar as colunas `data_opcao_2/3` anuláveis na entidade e em uma nova migração Flyway (`ALTER COLUMN ... DROP NOT NULL`); tratar `null` em `RecepcaoAgendamentoService.confirmar` (opção escolhida sem data); e ocultar opções nulas no modal da recepção.

### Assistente de agendamento (`pages/NovoExame/`)

- Cada etapa é uma tela separada, no tamanho de um card grande; abaixo dos 4 passos há uma barra que avança 25% → 50% → 75% → 100%.
- Na etapa 3 o paciente usa o mesmo `SeletorHorario` do painel: o calendário mostra os dias abertos (`GET /api/agenda/dias`) e, ao clicar em um dia, aparece a grade de horários (`GET /api/agenda/dias/{data}/horarios`) com horários livres, ocupados e passados. Dias fechados e horários indisponíveis não podem ser escolhidos, e um mesmo horário não se repete entre as opções. Ao reagendar, o horário confirmado do próprio paciente continua selecionável.
- Escolher o exame leva à etapa 2; escolher o paciente (ou salvar um dependente) leva à etapa 3; **Continuar** valida as datas e leva à confirmação. Dá para voltar pelos botões ou clicando em um passo já alcançado.
- **Reagendar** abre direto na etapa 3 (exame e paciente ficam fixos); **Agendar novamente** (exame concluído) abre na etapa 3 com exame e paciente pré-selecionados.
- **Tela branca ao digitar a data (corrigido):** o fluxo do paciente não usa mais `datetime-local`; a data e o horário vêm do calendário/grade da agenda, e há um `ErrorBoundary` global como rede de segurança.

### Formato de erro

Toda falha do back-end tem o mesmo formato:
```json
{ "timestamp": "2026-10-27T11:54:35", "status": 400, "error": "Bad Request", "message": "Já existe um usuário cadastrado com este CPF." }
```
Erros de validação de vários campos chegam em um único `message`, separados por `; `.

| Status | Quando |
|---|---|
| 400 | Validação, regra de negócio (CPF/e-mail duplicado, pendência duplicada, cancelar já cancelado) |
| 401 | Credenciais inválidas, token ausente/inválido/expirado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 500 | Erro não tratado (veja [pendências](#-problemas-conhecidos-e-pendências)) |

### Como adicionar um novo endpoint no front

1. Crie a função em `src/services/api.js`, dentro do objeto do recurso, usando `request(...)`.
2. Chame essa função na tela (ou em um hook em `src/hooks/`), tratando `try/catch` e exibindo `e.message` ao usuário.
3. Se o campo tiver máscara ou validação, adicione em `utils/mascaras.js` / `utils/agendamento.js`.

---

## 📋 Regras de negócio que afetam o front

- **Três datas obrigatórias**, futuras. O back-end não exige que sejam diferentes; o front exige.
- **Uma pendência por paciente e exame:** se já existe uma solicitação `PENDENTE` para o mesmo paciente e exame, o back-end recusa (400) com uma mensagem explicativa. É possível pedir o mesmo exame para pacientes diferentes.
- **Status da solicitação:** `PENDENTE` → `CONFIRMADO` / `RECUSADO` → `CONCLUIDO`, ou `CANCELADO`. As telas já exibem todos; hoje o paciente só consegue chegar a `PENDENTE` e `CANCELADO`.
- **Cancelamento:** permitido para `PENDENTE` e `CONFIRMADO`.
- **Parentesco do dependente** (valores aceitos pelo banco): `FILHO`, `CONJUGE`, `PAI_MAE`, `OUTRO`. `TITULAR` é criado automaticamente no cadastro e **não pode** ser enviado em um dependente.
- **CPF de dependente** é opcional, mas, se informado, deve ser único no sistema.
- **Convênio** do dependente vira `"Particular"` quando em branco.
- **E-mail** é comparado respeitando maiúsculas/minúsculas no login. Oriente o usuário a entrar com a mesma grafia do cadastro (ou CPF).

---

## 🗄 Back-end em resumo

Arquitetura em camadas no pacote `com.hospital.agendamento_api`:

```
controller  →  service  →  repository  →  PostgreSQL
 (REST/DTO)    (regras)     (Spring Data JPA)
```

| Pacote | Conteúdo |
|---|---|
| `controller` | Endpoints REST (`/api/auth`, `/api/usuarios`, `/api/exames`, `/api/pacientes`, `/api/agendamentos`) |
| `service` | Regras de negócio, conversão entidade ⇄ DTO |
| `repository` | Interfaces Spring Data JPA |
| `entity` | Entidades JPA (`Usuario`, `Paciente`, `Agendamento`, `Exame`, `Endereco`, `Cargo`, `Medico`) |
| `dto` | *Records* de entrada e saída da API |
| `security` / `config` | Filtro JWT, geração/validação do token, CORS, BCrypt |
| `exception` | `GlobalExceptionHandler` e erros de negócio |

**Banco de dados** (migrações Flyway em `src/main/resources/db/migration`): `cargos`, `enderecos`, `usuarios`, `pacientes`, `medicos`, `exames`, `agendamentos`.

- Cada tabela tem `id` numérico (interno) e `public_id` UUID (exposto na API).
- Um **usuário** é quem faz login. Um **paciente** é quem pode ser atendido: o titular (o próprio usuário) ou um dependente vinculado a ele (`usuario_responsavel_id`).
- Um **agendamento** liga solicitante, paciente e exame, e guarda as três datas sugeridas (`data_opcao_1..3`) e a data confirmada.
- Para alterar o banco, **crie uma nova migração** (`V4__...sql`); nunca edite uma migração já aplicada.

Mais detalhes no README do repositório do back-end.

---

## 🤝 Como contribuir

- O histórico do projeto usa mensagens de commit com prefixo: `feat:`, `fix:`, `docs:`…
- Antes de abrir um *pull request*, rode `npm run lint` e `npm run build` — ambos devem terminar sem erros.
- Mantenha as chamadas HTTP em `src/services/`, a lógica de formatação/validação em `src/utils/` e as telas em `src/pages/`.
- Mensagens exibidas ao usuário devem estar em português.
- Mudou um contrato da API (campo novo, rota nova)? Atualize `services/api.js` e a seção [Integração com a API](#-integração-com-a-api) deste README.

---

## ✅ Qualidade e testes

- **Lint:** `npm run lint` (ESLint com regras recomendadas + `react-hooks`).
- **Build:** `npm run build`.
- **Testes automatizados:** ainda **não existem**. O front não tem nenhum e o back tem apenas o teste padrão de inicialização (`contextLoads`). Hoje a validação é manual: cadastre um usuário, faça login, solicite um exame e consulte/cancele.

Roteiro rápido de teste manual:

1. Sem login, a navegação mostra só **Início** e **Entrar**.
2. Cadastre-se digitando o CEP: rua, bairro, cidade e UF devem ser preenchidos.
3. Após o cadastro você deve entrar direto no Painel, com **Perfil** na navegação.
4. Em **Perfil**, confira os dados e os botões de atalho.
5. Em **Agendar Exame**, cadastre um dependente, escolha o exame, informe 3 datas diferentes e confirme.
6. Em **Consultar Exames**, veja o paciente, as datas sugeridas e cancele a solicitação.
7. Saia e entre de novo usando o **CPF** (só números ou com pontuação) e depois o **e-mail**.

---

## ⚠ Problemas conhecidos e pendências

### Front-end

- **Favicon ausente:** o `index.html` usa `/favicon.svg`, mas ele não existe em `public/`. Crie `public/favicon.svg` (o Vite serve a pasta `public/` na raiz do site). A foto da página inicial já está em `public/hospital.jpg`.
- **Arquivos vazios** em `src/pages/NovoExame/` (veja [Estrutura](#-estrutura-do-projeto)).
- A barra de progresso da tela *Novo exame* é apenas visual (não acompanha o preenchimento).
- Sem React Router: a URL não muda ao navegar.
- Sem testes automatizados.
- Dependência do ViaCEP para o preenchimento por CEP (o cadastro funciona sem ele, só sem o auto-preenchimento).

### Back-end (a alinhar com quem desenvolve a API)

O front se protege de alguns destes problemas, mas a correção definitiva é no back-end:

| Problema | Efeito |
|---|---|
| Violações de regra do banco e entradas malformadas viram **500** genérico (CPF de dependente repetido, parentesco inválido, JSON malformado, UUID inválido na URL) | O front não consegue mostrar uma mensagem específica; deveriam ser 400/404/409 |
| O *service* compara o status com `REALIZADO`, mas o banco usa `CONCLUIDO` | Um agendamento concluído poderia ser cancelado |
| `GET /api/usuarios` e `GET /api/usuarios/{id}` aceitam **qualquer usuário logado** | Um paciente consegue ler CPF, e-mail e endereço de outros usuários; deveria exigir perfil administrativo |
| `POST /api/agendamentos` não confere se o `pacientePublicId` pertence ao solicitante | É possível agendar em nome de paciente de outra pessoa |
| E-mail comparado com diferença entre maiúsculas/minúsculas | `Maria@x.com` e `maria@x.com` são tratados como usuários diferentes |
| CORS só libera `localhost` | O domínio do front precisa ser adicionado antes de hospedar |
| Chave JWT e senha do banco com valores padrão no código; `show-sql=true` | Em produção, usar variáveis de ambiente e desligar o log de SQL |
| Não existe fluxo para a recepção confirmar/recusar solicitações | Toda solicitação permanece `PENDENTE` |
| README do back-end está desatualizado (cita `cargoId` no cadastro e outra biblioteca de JWT) | O código real não usa `cargoId`: o cargo é sempre `PACIENTE` |

### Hospedagem

Ainda não definida. Quando for definida: (1) hospedar o back-end com HTTPS e variáveis de ambiente seguras, (2) gerar o front com `VITE_API_URL` apontando para a API (`npm run build`), (3) liberar o domínio do front no CORS do back-end.
