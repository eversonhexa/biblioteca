# Aula 11 — Sessão de verdade e proteção das rotas

## Por que esta aula existe

Depois da Aula 10, o sistema tinha um problema sério, típico de projetos reais em construção: a tela de login conferia a senha de verdade, mas **nada usava esse resultado depois**. Em outras palavras:

- Era possível cadastrar um livro em **Cadastrar Livro** sem nunca ter feito login (e, pior: nem chegava a salvar no banco — era só uma simulação em memória, desde a Aula 3).
- Era possível registrar um **empréstimo** ou uma **devolução** sem estar logado — a rota `POST /api/emprestimos` aceitava qualquer pedido, de qualquer pessoa.

Isso é exatamente o tipo de falha que se estuda em Segurança de Software: **autenticação** (provar quem você é) sem **autorização** (checar, a cada ação, se quem está pedindo tem permissão) não protege nada. Um sistema só está protegido de verdade quando cada rota sensível confere a permissão **no servidor**, e não apenas esconde um botão na tela.

Esta aula resolve os dois problemas de uma vez:

1. Cria uma **sessão de verdade** no backend, então "estar logado" passa a valer entre páginas (não só enquanto o formulário de login está na tela).
2. Protege, no servidor, toda rota que grava dados: `POST /api/livros` (que também passou a existir de verdade nesta aula — antes não gravava no banco), `POST /api/emprestimos` e `PUT /api/emprestimos/:id/devolucao`.

## Pré-requisitos

- Ter concluído as **Aulas 1 a 10**.
- Rodar `npm install` de novo dentro de `backend/` (ganhamos uma dependência nova: `express-session`).

## 1. Arquivos alterados/novos nesta aula

```
backend/
├── package.json                → nova dependência: express-session
├── .env.example                  → nova variável: SESSION_SECRET
├── server.js                     → configura o express-session
├── middlewares/
│   └── exigirLogin.js            → NOVO: middleware de autenticação
├── routes/
│   ├── auth.js                    → login agora cria sessão; +GET /sessao, +POST /logout
│   ├── livros.js                  → NOVO: POST /  (cadastro de verdade, protegido)
│   └── emprestimos.js             → POST / e PUT /:id/devolucao passaram a exigir login

frontend/
├── js/
│   ├── auth.js                    → NOVO: obterSessaoAtual(), encerrarSessao()
│   ├── script.js                   → menu passa a mostrar "Entrar" ou "Sair (nome)"
│   ├── login.js                    → URL relativa + redireciona após login
│   ├── acervo.js                   → URL relativa
│   ├── emprestimos.js              → URLs relativas; formulário exige login
│   └── cadastro.js                 → reescrito: grava de verdade, exige login
├── cadastro.html                   → mensagem de "faça login"; tabela deixa de ser "só desta sessão"
├── emprestimos.html                → mensagem de "faça login"
└── index.html, acervo.html, login.html → id="link-conta" no menu
```

## 2. O que é uma sessão (e por que ela precisa de um cookie)

HTTP é, por natureza, **sem estado** (*stateless*): cada requisição chega ao servidor "do zero", sem lembrança nenhuma da anterior — mesmo que as duas tenham vindo do mesmo navegador, um segundo antes. Se é assim, como o servidor "lembra" que você já fez login?

A resposta mais comum é a **sessão por cookie**:

1. Você manda usuário/senha em `POST /api/login`.
2. O servidor confere e, se estiver certo, guarda os seus dados numa área de memória (a "sessão") e associa isso a um identificador aleatório.
3. O servidor manda esse identificador de volta para o navegador dentro de um **cookie** (um pequeno dado que o navegador guarda e reenvia sozinho, automaticamente, em toda requisição futura para o mesmo site).
4. Nos próximos pedidos (`POST /api/emprestimos`, por exemplo), o navegador manda esse cookie de volta sem você fazer nada. O servidor lê o identificador, encontra a sessão correspondente e sabe: "ah, é o usuário `bibliotecaria`".

Quem faz esse trabalho pesado por nós é o pacote `express-session`:

```js
const session = require("express-session");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "segredo-de-desenvolvimento-troque-no-env",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4, // 4 horas
      secure: false,
    },
  })
);
```

- **`secret`**: usado para **assinar** o cookie (uma garantia criptográfica de que ele não foi adulterado no caminho). Fica no `.env`, nunca no código — assim como a senha do banco.
- **`resave: false`**: não regrava a sessão no armazenamento se nada mudou nela durante a requisição — evita trabalho à toa.
- **`saveUninitialized: false`**: não cria uma sessão (nem manda um cookie) para quem ainda nem logou — só criamos sessão quando ela é realmente usada pela primeira vez, em `POST /api/login`.
- **`cookie.maxAge`**: por quanto tempo, em milissegundos, a sessão continua valendo sem uso. Depois disso, o cookie expira e a pessoa precisa logar de novo.
- **`cookie.secure`**: se `true`, o cookie só seria enviado por HTTPS. Numa rede de escola, sem HTTPS configurado, isso quebraria o login — por isso deixamos `false` aqui (fica registrado como um ponto a evoluir num deploy real, com HTTPS).

Onde essa sessão fica guardada? Por padrão, o `express-session` guarda tudo **em memória, dentro do próprio processo do Node.js** — ótimo para aprender e para um sistema pequeno como este, mas com uma limitação real: se você reiniciar o servidor (`nodemon` reiniciando sozinho, por exemplo, ou um `Ctrl+C`), **todo mundo é deslogado**, porque a memória foi zerada. Sistemas maiores trocam esse armazenamento em memória por um banco como o Redis — fica como ideia para ir além.

## 3. Por que a sessão exige "mesma origem" (e por que isso já estava pronto)

Cookies são amarrados a um **domínio/porta** (a "origem" de um site). Um cookie criado por `http://localhost:3000` só é reenviado automaticamente pelo navegador em pedidos para `http://localhost:3000` — não para `http://127.0.0.1:5500` (o Live Server), mesmo rodando na mesma máquina.

É por isso que, a partir desta aula, o frontend **precisa** ser aberto a partir do próprio backend (`http://localhost:3000/`, servido pelo `express.static` desde a Aula 10) — e não mais pelo Live Server. Isso já era sugerido como "desafio final" no material da Aula 10; agora deixou de ser opcional, porque sessão por cookie depende disso para funcionar de forma simples e confiável.

Fazer cookies cruzarem origens diferentes é possível (`SameSite=None; Secure`), mas **exige HTTPS** — o que não é razoável configurar para desenvolvimento local numa rede de escola. Por isso a recomendação, nesta fase do curso, é: **sempre acesse pelo `http://localhost:3000/` (ou pelo IP do servidor, na mesma porta)**.

Consequência prática: todos os `fetch()` do frontend passaram de URLs fixas (`http://localhost:3000/api/livros`) para **URLs relativas** (`/api/livros`) — o navegador resolve isso automaticamente em relação à página que fez o pedido, funcionando tanto em `localhost` quanto no IP de um servidor de laboratório (o mesmo raciocínio da seção 9 da Aula 10).

## 4. O middleware `exigirLogin`

Um **middleware**, no Express, é uma função com a assinatura `(req, res, next)` que roda **antes** da rota final. Ela decide: deixa passar (chamando `next()`) ou interrompe ali mesmo, respondendo direto.

```js
// backend/middlewares/exigirLogin.js
function exigirLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ erro: "Você precisa estar logado para fazer isso." });
  }
  next();
}

module.exports = exigirLogin;
```

Usamos assim, numa rota:

```js
router.post("/", exigirLogin, async (req, res) => {
  // este código só executa se exigirLogin chamou next()
});
```

O Express permite empilhar quantas funções quiser entre a URL e o handler final — `exigirLogin` é só mais uma parada no caminho. Se a sessão não existir, a resposta **401 Unauthorized** já sai dali, e o código da rota (que faria o `INSERT`, por exemplo) nunca chega a rodar.

**Ponto central desta aula, que vale repetir:** essa proteção vale para **qualquer** requisição, não só para quem clica em botões na nossa tela — alguém chamando `POST /api/livros` direto pelo Postman, curl, ou o DevTools do navegador, sem sessão válida, recebe o mesmo 401. É essa garantia, no servidor, que realmente impede o cadastro/empréstimo sem login — nunca o frontend sozinho.

## 5. `routes/auth.js`: criar e destruir a sessão

No login, depois de conferir a senha (que já fazíamos desde a Aula 10), passamos a **gravar quem logou dentro da sessão**:

```js
req.session.usuario = {
  id: usuarioEncontrado.id,
  usuario: usuarioEncontrado.usuario,
  nome: usuarioEncontrado.nome,
};
```

Repare que nunca guardamos `senha_hash` na sessão — ela não faz falta depois do login, e quanto menos dado sensível circula, melhor.

Duas rotas novas:

```js
// GET /api/sessao — "quem está logado agora?"
router.get("/sessao", (req, res) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ erro: "Nenhum usuário logado." });
  }
  res.json(req.session.usuario);
});

// POST /api/logout — encerra a sessão
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ mensagem: "Sessão encerrada." });
  });
});
```

`GET /api/sessao` **não** é protegida por `exigirLogin` — ela é justamente a forma de descobrir se existe login ou não, então precisa responder para todo mundo (só que com 401 para quem não está logado, e 200 com os dados para quem está). É essa rota que o frontend consulta ao carregar qualquer página, para decidir o que mostrar.

## 6. O frontend: `js/auth.js` e o menu

Criamos um arquivinho compartilhado, carregado antes dos outros:

```js
// frontend/js/auth.js
async function obterSessaoAtual() {
  try {
    const resposta = await fetch("/api/sessao");
    if (!resposta.ok) return null;
    return await resposta.json();
  } catch {
    return null;
  }
}

async function encerrarSessao() {
  try {
    await fetch("/api/logout", { method: "POST" });
  } finally {
    window.location.reload();
  }
}
```

E `script.js` (carregado em toda página) usa isso para trocar o link "Entrar" do menu por "Sair (nome)" quando há sessão:

```js
async function atualizarLinkConta() {
  const linkConta = document.getElementById("link-conta");
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    linkConta.textContent = "Entrar";
    linkConta.href = "login.html";
    return;
  }

  linkConta.textContent = `Sair (${sessao.nome})`;
  linkConta.href = "#";
  linkConta.onclick = (evento) => {
    evento.preventDefault();
    encerrarSessao();
  };
}
```

Note a ordem dos `<script>` no HTML — importa, porque `script.js` usa uma função definida em `auth.js`:

```html
<script src="js/auth.js"></script>
<script src="js/cadastro.js"></script>
<script src="js/script.js"></script>
```

## 7. `js/cadastro.js`: da simulação ao cadastro de verdade

Até aqui, `cadastro.js` guardava os livros num array **só na memória do navegador** — nunca chegava a chamar o backend. Nesta aula, ele ganhou duas mudanças:

1. **`protegerPagina()`**: consulta `/api/sessao` ao carregar a página e esconde o formulário inteiro (mostrando uma mensagem "faça login") para quem não está autenticado.
2. **`POST /api/livros` de verdade**, no envio do formulário — com tratamento explícito do `401` (a sessão pode expirar enquanto a pessoa preenche o formulário; nesse caso, escondemos o formulário de novo, em vez de deixá-lo ali "quebrado").

A validação dos campos continua existindo no navegador (feedback rápido, sem round-trip ao servidor) — mas ela é **repetida, de forma independente, no servidor** (`backend/routes/livros.js`), porque validação só no navegador pode sempre ser contornada.

## 8. `js/emprestimos.js`: mesma ideia, dois lugares protegidos

O formulário de registrar empréstimo e o botão "Registrar devolução" seguem a mesma lógica: escondidos para quem não está logado, e com tratamento de `401` caso a sessão expire no meio do uso. A tabela de consulta (empréstimos ativos e histórico) continua visível para qualquer pessoa — só **alterar** dados exige login, não **consultar**.

## 9. Testando

1. Rode `npm install` de novo dentro de `backend/` (por causa do `express-session`).
2. Copie a variável `SESSION_SECRET` do `.env.example` atualizado para o seu `.env` (pode ser qualquer texto).
3. `npm run dev` e acesse `http://localhost:3000/` (não use mais o Live Server).
4. **Sem logar:** tente abrir **Cadastrar Livro** e **Empréstimos** — os formulários devem estar escondidos, com a mensagem pedindo login.
5. Confirme também pelo lado do servidor: com o backend rodando e sem estar logado no navegador, tente
   ```
   curl -i -X POST http://localhost:3000/api/livros -H "Content-Type: application/json" -d "{\"titulo\":\"Teste\",\"autor\":\"Teste\",\"categoria\":\"Outro\",\"ano\":2020}"
   ```
   A resposta deve vir com status `401`, mesmo sem passar pela tela.
6. Faça login (`bibliotecaria` / `biblioteca123`). Você deve ser redirecionado para a página inicial, e o menu deve trocar "Entrar" por "Sair (Ana...)".
7. Navegue até **Cadastrar Livro** — o formulário deve aparecer agora. Cadastre um livro e confirme que ele aparece também na tela **Acervo** (prova de que foi gravado no banco, não só na memória).
8. Registre um empréstimo e uma devolução normalmente.
9. Clique em "Sair" no menu — o menu deve voltar a mostrar "Entrar", e os formulários de Cadastrar Livro/Empréstimos devem voltar a ficar escondidos.

## 10. Ajuste extra: campo ISBN

Depois desta aula, o cadastro de livros ganhou mais um campo: **ISBN** (International Standard Book Number), o código numérico de 13 dígitos que identifica de forma única cada edição de um livro — pense nele como o "RG" daquela edição específica.

Algumas decisões de design, e por quê:

- **Campo opcional.** O padrão ISBN, como usamos hoje (13 dígitos), só existe desde 2007 (antes disso, eram 10 dígitos; e antes de ~1970, não existia nada). Vários livros do nosso acervo de exemplo (como *Dom Casmurro*, de 1899) são anteriores ao próprio ISBN — exigir o campo tornaria impossível cadastrar um livro assim.
- **Aceita hífens na digitação.** Um ISBN normalmente aparece formatado, como `978-85-359-0277-5`. Em vez de obrigar a pessoa a digitar só números, normalizamos no código — tanto no frontend quanto no backend — removendo tudo que não for dígito antes de validar e salvar:
  ```js
  function normalizarIsbn(valor) {
    return valor.replace(/[^0-9]/g, "");
  }
  ```
- **Único no banco.** A coluna `isbn`, em `sql/schema.sql`, tem a restrição `UNIQUE` — dois livros não podem ter o mesmo ISBN. Como o campo também aceita `NULL` (livro sem ISBN), e o MySQL trata cada `NULL` como "diferente de qualquer outro `NULL`" para fins de `UNIQUE`, vários livros podem ficar sem ISBN ao mesmo tempo sem conflito.
- **Erro tratado como 409, não 500.** Se alguém tentar cadastrar um ISBN que já existe, o MySQL recusa o `INSERT` com um erro (`ER_DUP_ENTRY`). Em vez de deixar isso virar um genérico "erro interno" (`500`), capturamos esse código específico e respondemos `409 Conflict` com uma mensagem clara — o mesmo status HTTP que já usamos, desde a Aula 9, para "este livro não está disponível para empréstimo" (uma regra de negócio sendo violada, não um bug).

**Se você já tinha criado o banco antes deste ajuste**, sua tabela `livros` ainda não tem a coluna `isbn`. Rode uma vez, no MySQL Workbench ou via linha de comando, o comando que está comentado no final da definição da tabela em `sql/schema.sql`:

```sql
ALTER TABLE livros ADD COLUMN isbn VARCHAR(13) NULL UNIQUE AFTER ano;
```

(Quem for configurar o projeto do zero não precisa se preocupar com isso — a coluna já nasce junto, rodando `sql/schema.sql` normalmente.)

## 11. Desafios para praticar

- Adicione um `console.log` dentro de `exigirLogin` e observe, no terminal do backend, quando ele é chamado — inclusive quando você só está *consultando* o acervo (dica: não deveria ser chamado nesse caso).
- Proteja também a exclusão de um empréstimo, caso você implemente essa rota como exercício extra.
- Pesquise o que é **CSRF** (Cross-Site Request Forgery) e por que sistemas que usam sessão por cookie, em produção, costumam se proteger contra esse tipo de ataque além da própria autenticação.
- Pense: o que aconteceria com as sessões de todo mundo se o servidor reiniciasse agora? Isso seria um problema num sistema de verdade? Que solução existe para isso (dica: sessão guardada fora da memória do processo)?
- Hoje só conferimos se o ISBN tem 13 dígitos — não se ele é um ISBN *válido*. Um ISBN-13 de verdade tem um 13º dígito ("dígito verificador") calculado a partir dos outros 12, com uma fórmula de pesos alternados (1 e 3). Pesquise o algoritmo e implemente essa checagem em `normalizarIsbn`/na validação — assim, `9999999999999` deixaria de ser aceito como válido só porque tem 13 dígitos.

## Próxima aula

Ideias para continuar depois desta (mesma lista da Aula 10, ainda válida): edição/exclusão de livros e alunos, paginação do acervo, deploy real com HTTPS, testes automatizados — e, agora que a sessão existe, dá para pensar em **diferentes papéis de usuário** (por exemplo: aluno só consulta, bibliotecária cadastra e empresta).
