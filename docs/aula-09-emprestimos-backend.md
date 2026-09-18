# Aula 9 — Empréstimos e devoluções na prática

## Objetivo

Integrar a tela de Empréstimos ao backend de verdade: criar as rotas `GET/POST /api/emprestimos` e `PUT /api/emprestimos/:id/devolucao`, além de `GET /api/alunos`, e mover para o servidor a regra de negócio que, até aqui, só existia no frontend ("só é possível emprestar um livro disponível").

Esta é a aula mais "pesada" em conceitos de backend até agora — vale reler com calma.

## Pré-requisitos

- Ter concluído as **Aulas 1 a 8**.

## 1. Arquivos alterados nesta aula

```
backend/
├── db.js                    → dateStrings: true
└── server.js                 → rotas /api/alunos e /api/emprestimos (GET, POST, PUT)

frontend/
├── emprestimos.html           → campo "aluno" virou <select>; removida a tag de dados-acervo.js
└── js/
    ├── emprestimos.js          → reescrito para consumir a API
    └── dados-acervo.js         → agora é 100% histórico (nenhuma tela usa mais)
```

## 2. Por que a regra de negócio precisava sair do frontend

Desde a Aula 4, o frontend garantia que só se podia emprestar um livro "disponível". Mas pense: **qualquer pessoa pode abrir o DevTools, ou usar uma ferramenta como o Postman/Insomnia, e mandar um pedido `POST` diretamente para `http://localhost:3000/api/emprestimos`, sem nunca passar pelo nosso formulário.** Se a única verificação estivesse no JavaScript da página, essa regra simplesmente não existiria de verdade.

> **Regra de ouro do backend:** nunca confie em dados ou validações vindas do cliente (navegador, app, o que for). O frontend valida para dar uma boa experiência (feedback rápido, sem esperar o servidor). O backend valida porque é o único lugar que realmente pode garantir a regra.

É exatamente o que fizemos: a checagem "o livro está disponível?" agora mora dentro da rota `POST /api/emprestimos`, no servidor.

## 3. `express.json()`: lendo o corpo da requisição

Até a Aula 8, todas as nossas rotas eram `GET` — sem corpo, só a URL importava. Agora o frontend manda dados dentro do pedido:

```js
fetch(URL_API_EMPRESTIMOS, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ livroId: 3, alunoId: 1, dataPrevista: "2026-09-25" }),
});
```

Para o Express conseguir ler esse corpo como um objeto JavaScript (em vez de texto cru), precisamos do middleware:

```js
app.use(express.json());
```

A partir daí, qualquer rota pode acessar os dados enviados via `req.body` (veja em `app.post("/api/emprestimos", ...)`).

## 4. Route parameters e query strings — duas formas de receber dados pela URL

- **Route parameter** (`:id`): parte **fixa na estrutura** da URL, que representa um recurso específico. `PUT /api/emprestimos/7/devolucao` → dentro da rota, `req.params.id` vale `"7"`. Usamos isso quando o valor identifica *qual* recurso estamos alterando.
- **Query string** (`?status=historico`): parâmetros **opcionais**, no final da URL. `GET /api/emprestimos?status=historico` → `req.query.status` vale `"historico"`. Usamos isso para *filtros* ou *opções* de uma consulta — por isso a mesma rota `GET /api/emprestimos` devolve ativos por padrão, ou o histórico se você passar `?status=historico`.

## 5. SQL Injection e consultas parametrizadas

Repare que, em todas as consultas que usam dados vindos de fora (`req.body`, `req.params`), escrevemos assim:

```js
await conexao.query("UPDATE emprestimos SET data_devolucao = ? WHERE id = ?", [hojeISO, id]);
```

Os `?` são **placeholders**: o `mysql2` monta a consulta e o valor **separadamente**, de forma seguríssima. A alternativa ruim (e que você **nunca** deve fazer) seria montar a consulta colando texto:

```js
// NUNCA FAÇA ISSO:
await conexao.query(`UPDATE emprestimos SET data_devolucao = '${hojeISO}' WHERE id = ${id}`);
```

Se `id` viesse de um pedido malicioso contendo, por exemplo, `7; DROP TABLE emprestimos; --`, essa segunda forma executaria comandos SQL que **não eram para acontecer** — um ataque clássico chamado **SQL Injection**. Usar `?` (também chamado de *prepared statement*) elimina essa classe inteira de vulnerabilidade, porque o valor nunca é interpretado como parte do comando SQL, só como um dado.

## 6. Transações: `beginTransaction`, `commit`, `rollback`

Registrar um empréstimo envolve **duas** alterações no banco: inserir a linha em `emprestimos` **e** atualizar o `status` do livro para `'emprestado'`. Se a segunda falhasse por algum motivo (ex.: o servidor caiu bem nesse instante), ficaríamos com um empréstimo registrado mas o livro ainda marcado como disponível — dado inconsistente.

Uma **transação** agrupa várias instruções SQL como se fossem uma única operação atômica: ou todas acontecem, ou nenhuma acontece.

```js
const conexao = await pool.getConnection();
try {
  await conexao.beginTransaction();
  // ...várias instruções...
  await conexao.commit(); // confirma tudo
} catch (erro) {
  await conexao.rollback(); // desfaz tudo
} finally {
  conexao.release(); // devolve a conexão ao pool
}
```

## 7. Condição de corrida e `FOR UPDATE`

Imagine dois alunos, em dois computadores diferentes, clicando em "Registrar empréstimo" do **mesmo** livro (o último exemplar disponível) quase ao mesmo tempo. Sem cuidado nenhum, os dois pedidos poderiam checar "está disponível?" (sim, ainda não foi alterado por ninguém) **antes** de qualquer um dos dois terminar de gravar — e os dois empréstimos seriam aceitos. Isso é uma **condição de corrida** (*race condition*).

```sql
SELECT status FROM livros WHERE id = ? FOR UPDATE
```

O `FOR UPDATE`, usado dentro de uma transação, **trava** aquela linha da tabela até a transação terminar (`commit` ou `rollback`). Se um segundo pedido tentar ler a mesma linha com `FOR UPDATE` enquanto a primeira transação ainda está em andamento, ele **espera** — só prossegue depois que a primeira liberar. Isso garante que o segundo pedido vai enxergar o status já atualizado (`'emprestado'`), e será corretamente recusado.

## 8. Os novos códigos de status HTTP

Até aqui usamos só `200` (padrão) e `500`. Agora aparecem mais alguns, cada um com um significado específico:

| Código | Significado | Quando usamos |
|---|---|---|
| `200 OK` | Deu certo | Resposta normal de sucesso (ex.: devolução registrada) |
| `201 Created` | Deu certo, e um recurso novo foi criado | Depois de um `POST /api/emprestimos` bem-sucedido |
| `400 Bad Request` | O pedido está mal formado | Faltou algum campo, ou a data está no passado |
| `404 Not Found` | O recurso não existe | Livro ou empréstimo com esse id não existe |
| `409 Conflict` | O pedido é válido, mas conflita com o estado atual | Livro já emprestado; empréstimo já devolvido |
| `500 Internal Server Error` | Algo deu errado no servidor | Erro inesperado (banco fora do ar, bug, etc.) |

O frontend usa `resposta.ok` (verdadeiro só para a faixa 2xx) para decidir entre mostrar sucesso ou ler `corpo.erro` e mostrar a mensagem que o servidor escolheu — é assim que "Este livro não está disponível para empréstimo." aparece na tela, vinda direto da regra aplicada no servidor.

## 9. Como testar

1. Com o MySQL e o backend rodando (lembre-se: `npm install` de novo, se ainda não tiver rodado desde que adicionamos algo novo — mas nesta aula não adicionamos pacotes novos, só rotas), abra `frontend/emprestimos.html`.
2. Confirme que o `<select>` de aluno aparece preenchido (vindo de `GET /api/alunos`) e o de livro só com os disponíveis.
3. Registre um empréstimo. Confira que ele aparece na tabela "Empréstimos ativos" e que o livro escolhido some do select.
4. Abra `acervo.html` — o livro deve aparecer como "Emprestado" (agora isso é dado real do banco, não mais uma simulação por sessão).
5. Volte em "Empréstimos" e registre a devolução — o item deve mover para "Histórico de devoluções", e o livro deve voltar a aparecer como disponível.
6. **Teste da regra de negócio, direto na API:** com uma ferramenta como Postman/Insomnia (ou `curl`), tente um `POST http://localhost:3000/api/emprestimos` com um `livroId` que você sabe que já está emprestado. Deve voltar `409` com a mensagem "Este livro não está disponível para empréstimo." — mesmo sem passar pelo formulário.
7. Reinicie a página do navegador (F5) — ao contrário das aulas anteriores, os dados **continuam lá**: agora vêm do MySQL, não de um array que reiniciava a cada carregamento.

## 10. Desafios para praticar

1. No MySQL Workbench, insira manualmente mais alguns alunos e livros, e teste o fluxo completo de novo.
2. Adicione uma validação extra na rota `POST /api/emprestimos`: impedir que o mesmo aluno tenha dois empréstimos ativos ao mesmo tempo (dica: uma consulta `SELECT` antes do `INSERT`, dentro da mesma transação).
3. **Desafio avançado:** o projeto inteiro está em um único arquivo `server.js`, que já está ficando grande. Pesquise sobre `express.Router()` e tente separar as rotas em arquivos próprios (`routes/livros.js`, `routes/alunos.js`, `routes/emprestimos.js`), importados de volta no `server.js`.

## Próxima aula

**Aula 10 — Ajustes finais, autenticação e implantação (deploy)**: vamos revisitar o login (Aula 5) com autenticação de verdade (senha com hash, no backend), organizar melhor o código do servidor, e falar sobre como colocar o sistema completo no ar.
