# Aula 8 — Integração frontend + backend

## Objetivo

Fazer a tela de **Acervo** parar de usar o array fixo `dados-acervo.js` e passar a buscar os livros de verdade no nosso backend, usando `fetch()`. No caminho, vamos entender o que é **CORS** e por que o navegador bloqueia, por padrão, esse tipo de pedido entre origens diferentes.

Só a tela de Acervo é integrada nesta aula. Empréstimos e Cadastro continuam com dados simulados — eles são o assunto da Aula 9.

## Pré-requisitos

- Ter concluído as **Aulas 1 a 7** (frontend completo + backend com MySQL funcionando).
- Ter o backend rodando (`npm run dev`, dentro de `backend/`) **antes** de abrir a tela de Acervo — sem o servidor no ar, o `fetch` vai falhar (e é isso, inclusive, que testamos no final desta aula).

## 1. Arquivos alterados nesta aula

```
backend/
├── package.json          → nova dependência: cors
└── server.js              → app.use(cors())

frontend/
├── acervo.html             → removida a tag <script> de dados-acervo.js; novos elementos de carregamento/erro
└── js/
    ├── acervo.js            → agora busca os livros com fetch(), em vez do array
    └── dados-acervo.js       → comentário atualizado (não é mais usado por esta tela)
```

## 2. O que é CORS, e por que precisamos dele agora

Até aqui, o frontend era só HTML/CSS/JS "parado" — nenhuma página fazia pedidos para nenhum servidor. Agora que `acervo.js` faz um `fetch("http://localhost:3000/api/livros")`, entra em cena uma proteção de segurança do navegador chamada **política de mesma origem** (*same-origin policy*).

"Origem" é a combinação de protocolo + domínio + porta. Por exemplo:
- Frontend aberto pelo Live Server: `http://127.0.0.1:5500`
- Backend: `http://localhost:3000`

Mesmo os dois rodando na sua própria máquina, são origens **diferentes** (a porta já é suficiente para isso) — e, por padrão, o navegador **bloqueia** uma página de fazer `fetch` para uma origem diferente da sua. Essa regra existe para proteger o usuário: sem ela, qualquer site que você visitasse poderia, em segundo plano, fazer pedidos para o seu banco, seu e-mail etc., usando eventualmente sessões já autenticadas no seu navegador.

**CORS** (*Cross-Origin Resource Sharing*) é o mecanismo que permite ao **servidor** dizer explicitamente "está tudo bem, aceito pedidos vindos de outra origem" — através de um cabeçalho HTTP especial na resposta. Sem esse cabeçalho, o navegador recebe a resposta do servidor, mas **descarta** ela antes de entregar ao nosso JavaScript, e o `fetch` cai no `catch`.

No `server.js`, resolvemos isso com o pacote `cors`:

```js
const cors = require("cors");
app.use(cors());
```

`app.use(...)`, diferente de `app.get(...)`, não define uma rota específica — registra algo (chamado de *middleware*) que roda para **toda e qualquer** requisição, antes de chegar nas rotas. `cors()`, sem nenhuma opção, libera pedidos de **qualquer** origem — ótimo para desenvolvimento, mas em um sistema em produção o ideal é restringir para a origem exata do seu site: `cors({ origin: "https://minhabiblioteca.com.br" })`. Fica de exercício mental para quando chegarmos na aula de implantação.

## 3. `acervo.js`: de array fixo para `fetch()`

O coração da mudança:

```js
const URL_API_LIVROS = "http://localhost:3000/api/livros";
let livros = [];

async function carregarLivros() {
  mensagemCarregando.hidden = false;

  try {
    const resposta = await fetch(URL_API_LIVROS);

    if (!resposta.ok) {
      throw new Error(`O servidor respondeu com status ${resposta.status}`);
    }

    livros = await resposta.json();
    renderizarLivros(livros);
  } catch (erro) {
    mostrarAlerta("erro", "Não foi possível carregar o acervo. Verifique se o backend está rodando...");
  } finally {
    mensagemCarregando.hidden = true;
  }
}

carregarLivros();
```

Pontos novos:

- **`fetch(url)`**: faz um pedido HTTP (por padrão, GET) para a URL informada, e devolve uma *Promise* — por isso usamos `await`, do mesmo jeito que já fazíamos com `pool.query(...)` no backend.
- **`resposta.ok`**: o `fetch` só cai automaticamente no `catch` se houver uma falha de **rede** (servidor fora do ar, sem internet etc.). Se o servidor respondeu, mas com um erro HTTP (ex.: 500), o `fetch` considera que "deu certo" (a resposta chegou!) — por isso conferimos `resposta.ok` (verdadeiro só para respostas 2xx) na mão, e lançamos nosso próprio erro com `throw` se não estiver ok.
- **`await resposta.json()`**: a resposta chega "crua"; esse método lê o corpo dela e converte o texto JSON de volta para um array/objeto JavaScript. Também é assíncrono (por isso o `await`).
- **`try / catch / finally`**: o `finally` roda **sempre**, tenha dado certo ou não — por isso é o lugar certo para esconder a mensagem "Carregando...", que precisa sumir nos dois casos.
- **`let livros = []`**: antes, `listaDeLivros` vinha pronto de `dados-acervo.js`. Agora esse papel é de uma variável que começa vazia e só é preenchida depois que o `fetch` termina — por isso a busca (`filtrarLivros`) e a renderização inicial só fazem sentido **depois** de `carregarLivros()` terminar.

## 4. Estados de carregamento e erro

Duas coisas que uma tela "estática" nunca precisou considerar, e que toda tela que busca dados de um servidor precisa:

1. **Carregando:** entre o momento em que a página abre e o momento em que os dados chegam, existe um intervalo de tempo (pode ser rápido demais para notar aqui, na mesma máquina — mas seria bem perceptível na internet real). Por isso mostramos "Carregando acervo...".
2. **Erro:** o servidor pode estar fora do ar, ou o MySQL pode estar desconectado, ou pode faltar internet. Uma tela profissional nunca finge que "nunca dá erro" — ela avisa o usuário de forma clara, com o alerta vermelho que já usamos em outras telas.

## 5. Como testar

1. Certifique-se de que o MySQL está rodando e o backend também (`npm run dev`, dentro de `backend/`).
2. Abra `frontend/acervo.html` (de preferência pelo Live Server).
3. Deve aparecer rapidamente "Carregando acervo...", e em seguida a tabela com os livros — vindos, desta vez, de uma requisição HTTP real ao backend.
4. Abra as Ferramentas do Desenvolvedor (F12), aba "Network" (Rede), recarregue a página e observe o pedido para `/api/livros` — veja o status (200), os cabeçalhos de resposta (procure por `Access-Control-Allow-Origin`) e o corpo da resposta em JSON.
5. **Teste do erro:** vá ao terminal do backend e pare o servidor (`Ctrl + C`). Recarregue `acervo.html` — deve aparecer o alerta vermelho de erro, em vez da tabela travar ou a página quebrar silenciosamente.
6. Religue o backend (`npm run dev`) e recarregue a página de novo — deve voltar ao normal.

## 6. Desafios para praticar

1. Temporariamente, remova (ou comente) a linha `app.use(cors())` no `server.js`, reinicie o backend e recarregue `acervo.html`. Veja, no Console do navegador (F12), a mensagem de erro de CORS que aparece — é importante reconhecer essa mensagem no futuro. Depois, desfaça a mudança.
2. Adicionar um pequeno spinner visual (CSS) no lugar do texto "Carregando acervo...".
3. Fazer a mesma integração "na unha" para uma rota nova: crie `GET /api/alunos` no backend (se ainda não tiver feito, do desafio da Aula 7) e escreva uma função `carregarAlunos()` em um script novo, só para praticar o padrão — sem precisar criar uma tela nova para isso.

## Próxima aula

**Aula 9 — Empréstimos e devoluções na prática**: vamos integrar a tela de Empréstimos ao backend de verdade — criar as rotas `POST /api/emprestimos` e `PUT /api/emprestimos/:id/devolucao` no servidor, e mover as regras de negócio (só emprestar livro disponível, etc.) para lá, com o `JOIN` entre `emprestimos`, `livros` e `alunos` que citamos como curiosidade na Aula 7.
