# Conceitos do Backend — Sistema de Biblioteca Escolar

## Sobre este documento

As Aulas 6 a 12 (pasta `docs/`) contam a história de como o backend foi construído, passo a passo, na ordem em que os conceitos foram aparecendo. Este documento é diferente: é um **material de consolidação**, organizado por assunto em vez de por aula, para ver o backend como um todo — a estrutura, os arquivos, a configuração, a ligação com o banco de dados e a ligação com o frontend. A ideia é servir de referência para revisão, ou para explicar o projeto para alguém que ainda não acompanhou aula por aula.

Sempre que fizer sentido, o texto aponta de volta para a aula onde aquele conceito foi introduzido em mais detalhe.

## 1. Visão geral da arquitetura

O sistema segue a arquitetura mais comum da web: **cliente-servidor**, com um banco de dados por trás do servidor.

```
┌─────────────┐        HTTP (JSON)        ┌─────────────┐        SQL        ┌─────────────┐
│  Frontend   │ ────────────────────────► │   Backend   │ ─────────────────►│    MySQL    │
│ (navegador) │ ◄──────────────────────── │  (Node.js/  │ ◄──────────────── │  (banco de  │
│ HTML/CSS/JS │        respostas          │   Express)  │      linhas       │   dados)    │
└─────────────┘                           └─────────────┘                   └─────────────┘
```

- O **frontend** (pasta `frontend/`) é só HTML, CSS e JavaScript — roda inteiramente no navegador da pessoa usuária. Ele nunca fala com o MySQL diretamente.
- O **backend** (pasta `backend/`) é um processo Node.js que fica escutando pedidos HTTP numa porta (3000, no nosso caso). É o único que conversa com o banco.
- O **banco de dados** guarda os dados de forma permanente, estruturada em tabelas.

O backend expõe uma **API REST**: um conjunto de endereços (URLs) que representam **recursos** do sistema (`/api/livros`, `/api/alunos`, `/api/emprestimos`), onde cada verbo HTTP tem um significado (`GET` para consultar, `POST` para criar, `PUT` para atualizar). O frontend nunca manipula esses recursos diretamente — ele sempre pede ao backend, que decide o que é permitido e o que não é.

## 2. Estrutura de pastas do backend

```
backend/
├── server.js               → ponto de entrada: monta tudo e inicia o servidor
├── db.js                    → conexão com o MySQL (pool)
├── package.json              → dependências e scripts do projeto
├── .env                       → variáveis de ambiente reais (nunca vai pro Git)
├── .env.example                → modelo do .env, sem segredos, esse sim vai pro Git
├── middlewares/
│   └── exigirLogin.js          → bloqueia rotas para quem não está logado
├── routes/
│   ├── livros.js                → GET/POST /api/livros
│   ├── alunos.js                 → GET/POST /api/alunos
│   ├── emprestimos.js             → GET/POST/PUT /api/emprestimos
│   └── auth.js                     → login, sessão e logout
├── utils/
│   ├── senha.js                     → hash e verificação de senha
│   └── data.js                       → funções de data reaproveitadas
├── scripts/
│   └── criar-usuarios.js               → script avulso, roda na mão
└── sql/
    └── schema.sql                       → cria banco, tabelas e dados de exemplo
```

Essa separação por responsabilidade é um padrão comum em projetos Node.js/Express de qualquer tamanho: cada pasta tem um papel bem definido, o que facilita achar (e alterar) qualquer coisa sem precisar entender o sistema inteiro de uma vez. Isso nasceu na Aula 10, quando `server.js` estava crescendo demais.

## 3. Configuração do projeto

### `package.json`

Descreve o projeto e suas dependências:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "express-session": "^1.18.1",
    "mysql2": "^3.11.0",
    "dotenv": "^16.4.5",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

- **`dependencies`**: bibliotecas que o programa precisa para RODAR (em produção, na escola, etc.).
- **`devDependencies`**: ferramentas úteis só durante o desenvolvimento — aqui, o `nodemon`, que reinicia o servidor sozinho a cada arquivo salvo. Em produção normalmente não é usado (lá se roda `npm start`, não `npm run dev`).
- Rodar `npm install` lê esse arquivo e baixa tudo isso para dentro de `node_modules/` (pasta que nunca vai para o Git — veja `.gitignore`).

### Variáveis de ambiente (`.env` + `dotenv`)

Dados que mudam de máquina para máquina, ou que são sensíveis (senha do banco, chave de sessão), **nunca ficam escritos direto no código**. Em vez disso, ficam num arquivo `.env`, lido pelo pacote `dotenv`:

```js
require("dotenv").config();
// a partir daqui, process.env.DB_PASSWORD, process.env.PORT etc. existem
```

O `.env.example` é um modelo público (vai para o Git) mostrando quais variáveis existem, sem os valores reais. Cada pessoa que clona o projeto copia esse arquivo para `.env` e preenche com seus próprios valores. Essa separação é o que permite todo mundo compartilhar o mesmo código sem compartilhar senhas — um princípio básico tanto de organização de projeto quanto de segurança (veja a Aula 7 para a introdução do assunto).

## 4. O coração do servidor: `server.js`

`server.js` é o ponto de entrada: o arquivo que `node server.js` executa. Seu papel é **montar** as peças, não conter a lógica em si (essa mora em `routes/`):

```js
const app = express();

app.use(cors());
app.use(express.json());
app.use(session({ /* ... */ }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use("/api/livros", rotasLivros);
app.use("/api/alunos", rotasAlunos);
app.use("/api/emprestimos", rotasEmprestimos);
app.use("/api", rotasAuth);

app.listen(PORTA, () => { /* ... */ });
```

Cada `app.use(...)` registra um **middleware** — uma função que passa por TODO pedido que chega, na ordem em que foi registrada, antes de chegar à rota final. A ordem aqui importa de verdade:

1. **`cors()`** — libera o navegador a fazer pedidos vindos de outra origem (relevante quando se usa o Live Server durante o desenvolvimento; veja a seção 5).
2. **`express.json()`** — lê o corpo de requisições `POST`/`PUT` que vêm em JSON e disponibiliza como `req.body`. Sem isso, `req.body` seria `undefined`.
3. **`session(...)`** — cria/recupera a sessão do cookie do navegador e disponibiliza como `req.session`. Precisa vir ANTES de qualquer rota que use sessão.
4. **`express.static(...)`** — serve os arquivos do frontend (HTML/CSS/JS) diretamente, como se fosse um servidor de arquivos.
5. Só depois entram os **routers** (`app.use("/api/livros", rotasLivros)` etc.), que tratam os pedidos de API propriamente ditos.

## 5. Comunicação com o frontend

### Formato dos dados: JSON

Toda troca de dados entre frontend e backend usa **JSON** (`JavaScript Object Notation`) — um formato de texto que representa objetos e listas, fácil de gerar e ler tanto em JavaScript quanto em praticamente qualquer outra linguagem. O frontend manda JSON no corpo dos pedidos (`JSON.stringify(dados)`) e recebe JSON de volta (`await resposta.json()`).

### Verbos HTTP e o significado de cada rota

| Verbo    | Uso no projeto                          | Exemplo                              |
|----------|------------------------------------------|---------------------------------------|
| `GET`    | Consultar dados, sem alterar nada         | `GET /api/livros`                     |
| `POST`   | Criar um novo registro                    | `POST /api/livros`, `POST /api/login` |
| `PUT`    | Atualizar um registro existente           | `PUT /api/emprestimos/:id/devolucao`  |

### Códigos de status HTTP usados no projeto

| Código | Significado                          | Quando aparece                                              |
|--------|----------------------------------------|----------------------------------------------------------------|
| `200`  | OK                                      | Consulta ou ação bem-sucedida (resposta padrão)                |
| `201`  | Criado                                  | Um registro novo foi criado (`POST` com sucesso)                |
| `400`  | Pedido malformado                       | Faltou campo obrigatório, ou o valor enviado é inválido          |
| `401`  | Não autenticado                         | Login errado, ou rota protegida sem sessão válida                |
| `404`  | Não encontrado                          | Tentou devolver um empréstimo que não existe, por exemplo         |
| `409`  | Conflito com o estado atual             | Livro já emprestado, ISBN duplicado, empréstimo já devolvido      |
| `500`  | Erro interno do servidor                | Algo deu errado que não é "culpa" de quem fez o pedido            |

Usar o código certo (em vez de só `200` ou `500` para tudo) é o que permite ao frontend reagir de forma específica a cada situação — por exemplo, tratar `401` mostrando "faça login de novo", em vez de uma mensagem genérica de erro.

### CORS vs. mesma origem

No início do backend (Aula 8), frontend e backend rodavam em **origens diferentes** — o frontend pelo Live Server (`http://127.0.0.1:5500`) e o backend em `http://localhost:3000`. Por padrão, o navegador **bloqueia** um site de fazer pedidos para outra origem (a política de *same-origin*) — é aí que entra o **CORS** (`Cross-Origin Resource Sharing`), configurado com `app.use(cors())`, autorizando esses pedidos.

A partir da Aula 10, o próprio Express passou a servir o frontend (`express.static`), então, ao acessar tudo por `http://localhost:3000/`, frontend e backend passaram a ser a **mesma origem** — o que se tornou indispensável na Aula 11, porque **sessão por cookie exige mesma origem** para funcionar de forma simples (cookies entre origens diferentes exigiriam HTTPS). Por isso, desde a Aula 11, o projeto deve sempre ser acessado por `http://localhost:3000/`, e as URLs de API no frontend são **relativas** (`/api/livros`, não `http://localhost:3000/api/livros`).

## 6. Conexão e integração com o banco de dados

### `db.js`: o pool de conexões

```js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  // ...
  dateStrings: true,
});

module.exports = pool;
```

Um **pool** mantém várias conexões abertas com o MySQL, emprestando uma para cada consulta e devolvendo-a ao final — muito mais eficiente do que abrir e fechar uma conexão nova a cada requisição. `mysql2/promise` é a versão do driver MySQL que trabalha com `async`/`await`, em vez de callbacks — o que deixa o código de cada rota muito mais linear e fácil de ler.

`dateStrings: true` faz colunas `DATE`/`DATETIME` chegarem como texto simples (`"2026-09-18"`), em vez de objetos `Date` do JavaScript — mais simples de mandar como JSON e de comparar com os campos `type="date"` do frontend.

### Consultas parametrizadas (proteção contra SQL Injection)

Toda consulta no projeto usa `?` como marcador de posição, nunca concatenação de string:

```js
// CERTO — o driver escapa o valor antes de montar a consulta final
await pool.query("SELECT * FROM usuarios WHERE usuario = ?", [usuario]);

// NUNCA (não usado no projeto, só para contraste) — vulnerável a SQL Injection
await pool.query(`SELECT * FROM usuarios WHERE usuario = '${usuario}'`);
```

Se o valor viesse direto de `req.body` colado na string SQL, alguém poderia digitar algo como `' OR '1'='1` no campo de usuário e alterar o significado da consulta inteira. Os `?` garantem que o valor é sempre tratado como **dado**, nunca como parte do comando SQL — um dos conceitos centrais de Segurança de Software aplicados neste projeto.

### Modelagem (`sql/schema.sql`)

Quatro tabelas:

- **`livros`**: `id`, `titulo`, `autor`, `categoria`, `ano`, `isbn` (único, opcional), `status` (`ENUM('disponivel', 'emprestado')`).
- **`alunos`**: `id`, `nome`, `turma` (opcional).
- **`emprestimos`**: uma linha por empréstimo, com `livro_id` e `aluno_id` como **chaves estrangeiras** (`FOREIGN KEY`) — o MySQL recusa um empréstimo apontando para um livro ou aluno que não existe. `data_devolucao` começa `NULL` e só é preenchida na devolução.
- **`usuarios`**: `id`, `usuario` (único), `senha_hash`, `nome` — nunca guarda a senha em texto puro (seção 9).

Ao consultar empréstimos, usamos `JOIN` para trazer, numa única consulta, dados de três tabelas de uma vez, com apelidos (`AS`) para já entregar os nomes de campo no formato que o frontend espera (`camelCase`):

```sql
SELECT
  emprestimos.id,
  livros.titulo AS livroTitulo,
  alunos.nome AS alunoNome,
  emprestimos.data_prevista AS dataPrevista
FROM emprestimos
JOIN livros ON livros.id = emprestimos.livro_id
JOIN alunos ON alunos.id = emprestimos.aluno_id
```

## 7. Rotas organizadas com `express.Router()`

Cada arquivo em `routes/` é um **mini aplicativo Express**, cuidando só do seu assunto:

```js
// routes/livros.js
const router = express.Router();
router.get("/", async (req, res) => { /* ... */ });
router.post("/", exigirLogin, async (req, res) => { /* ... */ });
module.exports = router;
```

```js
// server.js
app.use("/api/livros", rotasLivros);
```

O prefixo (`/api/livros`) é decidido em `server.js`, na hora de "montar" o router — por isso, dentro do arquivo, as rotas são escritas só como `/`. O padrão do projeto, desde a Aula 11, é: **`GET` fica público** (qualquer um pode consultar o acervo, os alunos, os empréstimos), e **`POST`/`PUT` exigem login** (só quem está autenticado pode alterar dados) — refletido no segundo argumento de `router.post`/`router.put`: o middleware `exigirLogin`.

## 8. Regras de negócio e transações

A rota mais complexa do sistema é `POST /api/emprestimos`, porque envolve uma regra que depende do estado atual do banco ("só empresta livro disponível") e precisa alterar **duas tabelas ao mesmo tempo** (insere o empréstimo, atualiza o status do livro):

```js
const conexao = await pool.getConnection();
try {
  await conexao.beginTransaction();

  const [livros] = await conexao.query("SELECT status FROM livros WHERE id = ? FOR UPDATE", [livroId]);
  if (livros[0].status !== "disponivel") {
    await conexao.rollback();
    return res.status(409).json({ erro: "Este livro não está disponível para empréstimo." });
  }

  await conexao.query("INSERT INTO emprestimos (...) VALUES (...)");
  await conexao.query("UPDATE livros SET status = 'emprestado' WHERE id = ?", [livroId]);

  await conexao.commit();
} catch (erro) {
  await conexao.rollback();
  // ...
} finally {
  conexao.release();
}
```

- **Transação** (`beginTransaction`/`commit`/`rollback`): garante que o `INSERT` e o `UPDATE` acontecem **juntos, ou nenhum dos dois** — se algo falhar no meio, `rollback()` desfaz tudo, evitando um estado inconsistente (um empréstimo registrado, mas o livro ainda marcado como disponível, por exemplo).
- **`FOR UPDATE`**: trava a linha do livro durante a transação, evitando uma **condição de corrida** (*race condition*) — duas pessoas tentando emprestar o mesmo livro ao mesmo tempo, cada uma vendo "disponível" antes da outra terminar.
- **`finally { conexao.release() }`**: devolve a conexão ao pool sempre, aconteça o que acontecer — senão o pool ficaria sem conexões livres depois de algumas requisições.

## 9. Autenticação e sessão

### Hash de senha (`utils/senha.js`)

Senhas nunca são guardadas em texto puro. Usamos `crypto.scrypt` (módulo nativo do Node, sem precisar instalar nada):

```js
const salt = crypto.randomBytes(16).toString("hex");
crypto.scrypt(senha, salt, 64, (erro, chaveDerivada) => {
  // guardamos "salt:hash" como uma única string em senha_hash
});
```

- **`salt`**: valor aleatório, diferente por usuário, misturado à senha antes do hash — impede que duas pessoas com a mesma senha tenham o mesmo hash gravado.
- **`scrypt`**: de propósito lento/pesado, dificultando ataques de força bruta.
- **`crypto.timingSafeEqual`**: compara hashes em tempo constante, evitando um *timing attack* na comparação.

### Sessão (`express-session`)

Depois de conferir a senha, o login **não termina aí** — ele cria uma sessão:

```js
req.session.usuario = { id, usuario, nome };
```

O `express-session` (configurado em `server.js`) associa esses dados a um identificador aleatório, devolvido ao navegador como um **cookie**. Em cada pedido seguinte, o navegador reenvia esse cookie automaticamente, e o servidor consegue recuperar `req.session.usuario` sem pedir usuário/senha de novo.

### Protegendo rotas: `middlewares/exigirLogin.js`

```js
function exigirLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ erro: "Você precisa estar logado para fazer isso." });
  }
  next();
}
```

Usado como segundo argumento de uma rota (`router.post("/", exigirLogin, async (req, res) => { ... })`), interrompe o pedido com `401` antes mesmo de o código da rota rodar, se não houver sessão válida. Essa é a proteção que realmente importa: vale para qualquer pedido, inclusive um `curl` ou Postman direto na API, sem passar pela tela.

## 10. Scripts avulsos

Nem tudo no backend responde a um pedido HTTP. `scripts/criar-usuarios.js` é um programa independente, rodado manualmente (`node scripts/criar-usuarios.js`) para popular os usuários de teste — porque o hash da senha só pode ser calculado em JavaScript, não escrito à mão em SQL. Scripts assim precisam encerrar o pool manualmente ao final (`await pool.end()`), porque, sem um servidor HTTP mantendo o processo vivo, o Node ficaria "pendurado" esperando por conexões que nunca mais seriam usadas.

## 11. Tratamento de erros

Um padrão se repete em toda rota do projeto:

```js
try {
  // ... consulta ou alteração no banco
} catch (erro) {
  console.error("Falha ao X:", erro.message); // detalhe completo só no terminal do servidor
  res.status(500).json({ erro: "Não foi possível X." }); // mensagem genérica pro cliente
}
```

O detalhe técnico do erro (`erro.message`, muitas vezes com informação interna do banco) fica só no `console.error`, visível a quem está rodando o servidor — nunca é devolvido ao navegador. Isso evita vazar informação sobre a estrutura interna do sistema para quem está do outro lado da requisição, mais um princípio de Segurança de Software aplicado na prática. Quando um erro específico do banco é reconhecível (`ER_DUP_ENTRY` para violação de `UNIQUE`, `ER_NO_REFERENCED_ROW` para uma chave estrangeira inválida), ele é tratado à parte, virando um `400`/`409` com mensagem clara, em vez de um `500` genérico.

## 12. Glossário rápido

- **API**: conjunto de endereços que um programa expõe para outros programas (ou o próprio frontend) conversarem com ele.
- **REST**: um estilo de projetar APIs, onde URLs representam recursos e verbos HTTP representam ações sobre eles.
- **Middleware**: função que roda no meio do caminho de uma requisição, antes da rota final, podendo interromper ou deixar passar.
- **Endpoint**: uma combinação específica de verbo HTTP + URL (ex.: `POST /api/livros`).
- **Pool de conexões**: um conjunto de conexões com o banco, reaproveitadas entre requisições.
- **Hash**: transformação de um dado (a senha) num valor de tamanho fixo, sem volta.
- **Salt**: valor aleatório misturado antes do hash, para evitar hashes repetidos entre usuários com a mesma senha.
- **Sessão**: mecanismo para o servidor "lembrar" que um navegador já se autenticou, entre requisições.
- **Cookie**: pequeno dado guardado pelo navegador e reenviado automaticamente ao mesmo site.
- **CORS**: mecanismo do navegador que autoriza (ou não) um site a fazer pedidos para outra origem.
- **Transação**: um grupo de operações no banco que precisam acontecer todas juntas, ou nenhuma.
- **Variável de ambiente**: configuração que muda por máquina/ambiente, mantida fora do código-fonte.

## Onde ver isso em mais detalhe

Cada assunto deste documento foi introduzido, com contexto e exemplos passo a passo, numa aula específica:

- Estrutura inicial do backend e rotas: `docs/aula-06-node-intro.md`
- Banco de dados e conexão: `docs/aula-07-mysql.md`
- CORS e integração com o Acervo: `docs/aula-08-integracao-frontend-backend.md`
- Regras de negócio e transações: `docs/aula-09-emprestimos-backend.md`
- Hash de senha, `express.Router()` e deploy: `docs/aula-10-ajustes-finais-deploy.md`
- Sessão, `exigirLogin` e proteção de rotas: `docs/aula-11-sessao-e-protecao-de-rotas.md`
- Cadastro de alunos (reaplicando o padrão de cadastro protegido): `docs/aula-12-cadastro-alunos.md`
