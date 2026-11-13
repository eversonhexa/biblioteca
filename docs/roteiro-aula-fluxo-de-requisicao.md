# Roteiro de aula teórico-expositiva — Como o backend processa uma requisição

## Sobre este roteiro

Este documento é diferente dos demais em `docs/`: as Aulas 1 a 12 são um **tutorial** (constroem o sistema passo a passo, com código para escrever). Este aqui é um **roteiro de aula expositiva** — material de apoio para explicar, de forma teórica e usando o Sistema de Biblioteca Escolar como estudo de caso real, **o que acontece por baixo dos panos** entre o clique da pessoa usuária e a resposta que ela vê na tela.

A ideia não é reescrever código em aula, mas **narrar, em cima do código que já existe no projeto**, a jornada completa de uma requisição — de onde ela vem, como é processada, onde é validada, como toca o banco de dados, e como a resposta volta até virar algo na tela. Pode ser usado com turmas que já passaram pelas Aulas 6–12 (revisão/consolidação) ou como uma aula teórica isolada, projetando trechos de código do próprio projeto como exemplo.

## Objetivos de aprendizagem

Ao final da aula, a turma deve ser capaz de:

- Descrever o ciclo requisição-resposta HTTP com suas próprias palavras.
- Explicar o papel de cada camada pela qual uma requisição passa no Express (middleware, roteamento, validação, acesso a dados, resposta).
- Diferenciar validação no cliente (frontend) de validação no servidor (backend), e explicar por que as duas existem.
- Explicar, em alto nível, como o Node.js se conecta ao MySQL e por que se usa um *pool* de conexões.
- Descrever como uma sessão autenticada altera o processamento de uma requisição protegida.
- Explicar como os dados retornam do banco até a tela, no formato JSON.

## Duração estimada e roteiro sugerido

| Bloco | Assunto                                                        | Tempo sugerido |
|-------|------------------------------------------------------------------|-----------------|
| 0     | O que é um backend, em uma frase                                  | 5 min            |
| 1     | De onde vêm as requisições: o ciclo HTTP requisição-resposta       | 10 min           |
| 2     | Acompanhando uma requisição simples, do clique à tela (`GET`)       | 15 min           |
| 3     | Onde (e por que, duas vezes) entram as validações                    | 10 min           |
| 4     | Autenticação: uma requisição protegida, passo a passo (`POST`)        | 15 min           |
| 5     | Por baixo do `pool.query`: a conexão com o banco de dados               | 10 min           |
| 6     | Quando mais de uma coisa muda ao mesmo tempo: transações (breve)         | 10 min           |
| 7     | Do JSON de volta à tela: como a resposta é usada pelo frontend             | 10 min           |
|       | Encerramento e perguntas de verificação                                     | 5–10 min         |

Total aproximado: 90–100 minutos (encaixa em duas aulas de 50 min, se necessário — um bom ponto de corte é entre o Bloco 3 e o Bloco 4).

## Bloco 0 — O que é um backend, em uma frase

Ponto de partida para alinhar o vocabulário com a turma:

> **Backend é um programa que fica sempre rodando, esperando pedidos chegarem pela rede, e que sabe conversar com o banco de dados — o frontend nunca fala com o banco diretamente.**

Diagrama para desenhar no quadro (ou projetar):

```
┌─────────────┐        requisição HTTP        ┌─────────────┐        SQL        ┌─────────────┐
│  Frontend   │ ─────────────────────────────► │   Backend   │ ─────────────────►│    MySQL    │
│ (navegador) │ ◄───────────────────────────── │  (Node.js/  │ ◄──────────────── │  (dados     │
│             │           resposta             │   Express)  │      linhas       │  salvos)    │
└─────────────┘                                └─────────────┘                   └─────────────┘
```

**Pergunta para a turma:** "Por que o navegador não conversa direto com o MySQL?" (Respostas esperadas: segurança — expor o banco direto na internet seria um risco enorme; controle — o backend decide o que é permitido, valida regras de negócio, esconde a senha do banco; o navegador nem teria como falar o protocolo do MySQL.)

## Bloco 1 — De onde vêm as requisições: o ciclo HTTP requisição-resposta

Toda ação do sistema começa com uma **requisição HTTP** saindo do navegador. Ela tem sempre:

- Um **verbo** (o que se quer fazer): `GET` (consultar), `POST` (criar), `PUT` (atualizar).
- Uma **URL** (qual recurso): `/api/livros`, `/api/login`, `/api/emprestimos/7/devolucao`.
- Opcionalmente, um **corpo** (dados enviados), em formato JSON.
- Opcionalmente, **cookies** (usados para identificar uma sessão — ver Bloco 4).

E toda **resposta** HTTP tem sempre:

- Um **código de status**: um número que resume o resultado (`200` OK, `201` criado, `400` pedido malformado, `401` não autenticado, `404` não encontrado, `409` conflito, `500` erro interno).
- Um **corpo**, quase sempre em JSON no nosso projeto.

No frontend, é a função `fetch()` quem dispara a requisição:

```js
const resposta = await fetch("/api/livros", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ titulo, autor, categoria, ano, isbn }),
});
```

**Ponto-chave para reforçar:** o `fetch()` só lança uma exceção (cai no `catch`) se houver falha de **rede** (servidor desligado, sem internet). Uma resposta com erro HTTP, como `401` ou `500`, ainda chega normalmente — por isso todo o projeto confere `resposta.ok` manualmente antes de decidir se deu certo.

## Bloco 2 — Acompanhando uma requisição simples, do clique à tela

Exemplo guia: a pessoa abre a tela **Acervo** e o sistema busca a lista de livros (`GET /api/livros`). Esta é a jornada mais simples do sistema — boa para estabelecer o percurso completo antes de complicar com autenticação e escrita no banco.

**1. O gatilho, no frontend.** Ao carregar `acervo.html`, `acervo.js` chama `carregarLivros()`, que faz `fetch("/api/livros")`.

**2. A requisição viaja pela rede** até `http://localhost:3000` (ou o IP do servidor, numa rede de laboratório), na porta onde o Express está escutando (`app.listen`).

**3. Ela entra na fila de middlewares do Express**, na ordem exata em que foram registrados em `server.js`:

```js
app.use(cors());              // libera pedidos de outra origem (quando necessário)
app.use(express.json());       // faz req.body existir, quando há corpo JSON
app.use(session({ ... }));      // recupera (ou cria) req.session a partir do cookie
app.use(express.static(...));    // tentaria servir um arquivo estático — não é o caso aqui
```

Como `GET /api/livros` não é um arquivo, `express.static` deixa passar, e a requisição chega até os *routers*.

**4. O roteamento encontra o destino certo.** `server.js` montou `app.use("/api/livros", rotasLivros)` — então tudo que começa com `/api/livros` cai dentro de `routes/livros.js`. Ali, `router.get("/", ...)` é a rota que responde exatamente a esse caminho e verbo.

**5. O handler da rota executa:**

```js
router.get("/", async (req, res) => {
  try {
    const [linhas] = await pool.query("SELECT * FROM livros ORDER BY titulo");
    res.json(linhas);
  } catch (erro) {
    console.error("Falha ao buscar livros:", erro.message);
    res.status(500).json({ erro: "Não foi possível buscar os livros." });
  }
});
```

**6. `pool.query(...)` conversa com o MySQL** (detalhado no Bloco 5) e devolve as linhas encontradas, já como um array de objetos JavaScript.

**7. `res.json(linhas)` monta a resposta**: define o cabeçalho `Content-Type: application/json`, serializa o array para texto JSON, e o status (implícito `200`, já que nada de diferente foi definido).

**8. A resposta volta pela rede** até o navegador.

**9. De volta no frontend**, a `Promise` do `fetch()` resolve, `await resposta.json()` transforma o texto de volta em objetos JavaScript, e `renderizarLivros(livros)` percorre o array montando as linhas `<tr>` da tabela.

**Pergunta para a turma:** "Em qual desses 9 passos, se o servidor estivesse fora do ar, o `fetch()` cairia no `catch`?" (Resposta: nenhum dos passos 3–8 chega a acontecer; a falha é detectada na tentativa de conexão, entre os passos 2 e 3.)

## Bloco 3 — Onde (e por que, duas vezes) entram as validações

O projeto valida os dados em **dois lugares**, de propósito — vale desenhar isso explicitamente:

```
Frontend (cadastro.js)                    Backend (routes/livros.js)
─────────────────────                     ──────────────────────────
validarFormulario()                        (dentro de router.post)
  → checa título, autor,                     → checa os MESMOS campos
    categoria, ano, isbn                       de novo, de forma independente
  → se inválido: mostra erro                 → se inválido: responde 400
    e NEM chama a API                          com a mensagem de erro
```

**Ponto-chave:** a validação no frontend existe só por **conveniência** — dar feedback imediato, sem esperar uma ida e volta ao servidor. Ela **não protege nada**, porque roda inteiramente no navegador da própria pessoa usuária, que pode abrir o DevTools e chamar `fetch("/api/livros", ...)` diretamente, pulando o formulário e a validação. A validação que **realmente importa** é a do servidor, porque é a única que a pessoa do outro lado não controla.

Exemplo real do projeto (`routes/livros.js`):

```js
const erros = [];
if (typeof titulo !== "string" || titulo.trim().length < 2) {
  erros.push("Informe o título do livro (mínimo 2 letras).");
}
// ... mais checagens (categoria, ano, isbn) ...
if (erros.length > 0) {
  return res.status(400).json({ erro: erros.join(" ") });
}
```

**Pergunta para a turma:** "Se eu remover a validação do frontend mas mantiver a do backend, o sistema continua seguro? E se for o contrário?" (Primeira: sim, só piora a experiência — sem feedback rápido. Segunda: não — vira uma porta aberta para qualquer dado inválido chegar ao banco.)

## Bloco 4 — Autenticação: uma requisição protegida, passo a passo

Agora um exemplo mais completo: cadastrar um livro (`POST /api/livros`), que **exige estar logado**. Vale primeiro relembrar rapidamente como o login cria essa condição.

### 4.1 — O login (`POST /api/login`)

1. O navegador envia `{ usuario, senha }` em JSON.
2. O servidor busca o usuário no banco (`SELECT * FROM usuarios WHERE usuario = ?`).
3. Verifica a senha **sem nunca comparar texto puro**: recalcula o hash da senha recebida, usando o mesmo *salt* gravado, e compara os hashes (`crypto.scrypt` + `crypto.timingSafeEqual`, em `utils/senha.js`).
4. Se corresponder, o servidor grava os dados do usuário dentro da sessão: `req.session.usuario = { id, usuario, nome }`.
5. O `express-session` (configurado em `server.js`) associa esses dados a um identificador e manda esse identificador ao navegador como um **cookie**.
6. O navegador passa a **reenviar esse cookie automaticamente** em toda requisição futura para o mesmo servidor — é assim que o servidor vai "lembrar" quem está logado, sem receber usuário/senha de novo a cada clique.

### 4.2 — Uma requisição protegida (`POST /api/livros`), já logado

1. **Gatilho no frontend**: `cadastro.js` faz `fetch("/api/livros", { method: "POST", ... })` — o cookie de sessão vai junto **automaticamente**, sem o código precisar fazer nada especial para isso.
2. A requisição passa pelos mesmos middlewares do Bloco 2 — inclusive o `session(...)`, que agora **encontra** a sessão correspondente ao cookie recebido e popula `req.session.usuario`.
3. O roteamento cai em `routes/livros.js`, na rota `router.post("/", exigirLogin, async (req, res) => { ... })`.
4. **Antes** do código da rota rodar, o Express executa `exigirLogin`:

```js
function exigirLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ erro: "Você precisa estar logado para fazer isso." });
  }
  next();
}
```

   Como existe sessão válida, `exigirLogin` chama `next()` — deixando o pedido seguir para o handler de verdade. **Se não houvesse sessão, a resposta `401` sairia aqui mesmo, e o código de cadastro nunca chegaria a rodar.**
5. O handler valida os dados (Bloco 3) e, se estiverem corretos, executa o `INSERT` no banco (Bloco 5).
6. Responde `201 Created` com o livro cadastrado, ou um erro apropriado (`400`, `409` para ISBN duplicado, `500`).

**Ponto-chave central desta aula:** a proteção de `exigirLogin` vale para **qualquer** origem da requisição — não só para quem usa a tela. Alguém chamando `POST /api/livros` direto via Postman, `curl`, ou o próprio DevTools, sem estar logado, recebe exatamente o mesmo `401`. É por isso que se diz que a segurança "mora no servidor": esconder um botão na tela para quem não está logado é só uma conveniência de interface, não uma proteção — a proteção de verdade é essa checagem, que roda sempre, para todo mundo.

**Demonstração sugerida (se houver como projetar um terminal):** com o servidor rodando e sem estar logado no navegador, rodar

```
curl -i -X POST http://localhost:3000/api/livros -H "Content-Type: application/json" -d "{}"
```

e mostrar ao vivo o `401` retornado — prova concreta de que a proteção não depende da tela.

## Bloco 5 — Por baixo do `pool.query`: a conexão com o banco de dados

Voltando ao que acontece dentro de `pool.query("SELECT ...")` ou `pool.query("INSERT ...")`:

**O *pool* de conexões.** Em vez de abrir uma conexão nova com o MySQL a cada requisição (lento) e fechá-la depois, o backend mantém, desde que inicia, um conjunto de conexões já abertas (`mysql.createPool({...})`, em `db.js`). Cada consulta "empresta" uma conexão livre do pool, usa, e devolve — muito mais rápido, e suporta várias requisições simultâneas.

**Consultas parametrizadas.** Todas as consultas do projeto usam `?` como marcador de posição:

```js
pool.query("SELECT * FROM usuarios WHERE usuario = ?", [usuario]);
```

em vez de concatenar o valor recebido direto na string SQL. Isso é o que impede um ataque de **SQL Injection**: o driver do MySQL trata o valor de `usuario` sempre como **dado**, nunca como parte do comando — mesmo que alguém digite algo como `' OR '1'='1` no campo.

**O caminho de ida e volta:**

```
routes/livros.js          db.js (pool)          MySQL
─────────────────          ────────────          ─────
pool.query("SELECT...")
    │
    └────────────────────► conexão emprestada
                                 │
                                 └──────────────► executa a consulta
                                                       │
                            linhas encontradas ◄───────┘
    │
    └── recebido aqui, como
        array de objetos JS
```

O retorno de `pool.query` é sempre um array com duas posições — por convenção do `mysql2/promise`, desestruturamos só a primeira: `const [linhas] = await pool.query(...)`. `linhas` já chega como objetos JavaScript comuns (`{ id: 1, titulo: "Dom Casmurro", ... }`), prontos para virar JSON na resposta.

**Pergunta para a turma:** "O que aconteceria se, em vez de `?`, escrevêssemos `SELECT * FROM usuarios WHERE usuario = '${usuario}'` usando template string?" (Deixar claro o risco de injeção — bom gancho para a disciplina de Segurança de Software.)

## Bloco 6 — Quando mais de uma coisa muda ao mesmo tempo: transações (breve)

Alguns pedidos precisam alterar **mais de uma tabela juntas**, de forma tudo-ou-nada. Exemplo: registrar um empréstimo precisa (a) inserir a linha em `emprestimos` e (b) marcar o livro como `emprestado` em `livros`. Se o servidor "morresse" bem entre esses dois passos, o banco ficaria inconsistente (empréstimo registrado, mas livro ainda "disponível").

```js
const conexao = await pool.getConnection();
try {
  await conexao.beginTransaction();
  // ... SELECT ... FOR UPDATE (trava a linha, evita duas pessoas
  //     emprestando o mesmo livro ao mesmo tempo)
  // ... INSERT em emprestimos ...
  // ... UPDATE em livros ...
  await conexao.commit();       // confirma as DUAS alterações juntas
} catch (erro) {
  await conexao.rollback();     // desfaz TUDO se algo deu errado
} finally {
  conexao.release();            // devolve a conexão ao pool sempre
}
```

Não é preciso entrar em profundidade aqui (isso já é o assunto central da Aula 9) — o objetivo deste bloco é só a turma reconhecer o **padrão** e entender por que ele existe, encaixando no fluxo geral já apresentado.

## Bloco 7 — Do JSON de volta à tela: como a resposta é usada pelo frontend

Fechando o ciclo: como a resposta que o servidor manda vira algo visível?

```js
const resposta = await fetch(URL_API_LIVROS, { method: "POST", ... });
const corpo = await resposta.json();       // texto JSON → objeto JavaScript

if (!resposta.ok) {                          // resposta.ok é false para 4xx/5xx
  mostrarAlerta("erro", corpo.erro || "Não foi possível cadastrar o livro.");
  return;
}

// sucesso: corpo.livro tem os dados do livro recém-criado
mostrarAlerta("sucesso", `Livro "${corpo.livro.titulo}" cadastrado com sucesso!`);
```

O mesmo objeto `corpo` serve tanto para o caminho de sucesso quanto para o de erro — é o próprio backend, em cada `res.status(...).json({...})`, quem decide a forma exata da resposta, e o frontend só a interpreta. Essa "conversa combinada" entre o formato que o backend envia e o que o frontend espera é, na prática, o **contrato** entre as duas partes do sistema.

**Fechamento da aula — juntando tudo:** revisar o diagrama completo, agora com todas as camadas nomeadas:

```
Clique/ação          Middlewares        Rota +           Validação      Banco de       Resposta        Tela
no navegador  ──►  (cors, json,   ──►  Middleware  ──►   (servidor) ──► dados      ──►  (JSON +   ──►  atualizada
(fetch)              session,           de auth                          (pool.query)     status)
                     static)            (exigirLogin)
```

## Encerramento — perguntas para verificação de aprendizagem

Para fechar a aula (oral, ou como exercício rápido por escrito):

1. Descreva, com suas palavras, o caminho completo de uma requisição `GET /api/alunos`, do clique até a tabela aparecer na tela.
2. Por que a validação existe tanto no frontend quanto no backend? O que aconteceria se existisse só em um dos dois lugares?
3. O que é, exatamente, o middleware `exigirLogin`, e em que exato momento do processamento de uma requisição ele age?
4. O que impede um ataque de SQL Injection nas consultas deste projeto?
5. Por que uma requisição que escreve em duas tabelas (como registrar um empréstimo) precisa de uma transação, e o que aconteceria sem ela?
6. Se o `fetch()` no frontend não cai no `catch`, isso significa que a requisição teve sucesso? Por quê?

## Referência cruzada

Para aprofundar qualquer bloco desta aula com o código completo e o histórico de como cada peça foi construída:

- Estrutura geral, configuração e arquitetura: `docs/conceitos-backend.md`
- Rotas e Express: `docs/aula-06-node-intro.md` e `docs/aula-10-ajustes-finais-deploy.md`
- Banco de dados e consultas: `docs/aula-07-mysql.md`
- Validação e regras de negócio: `docs/aula-09-emprestimos-backend.md`
- Autenticação, hash de senha e sessão: `docs/aula-10-ajustes-finais-deploy.md` e `docs/aula-11-sessao-e-protecao-de-rotas.md`
