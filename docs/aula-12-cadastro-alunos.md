# Aula 12 — Cadastro de alunos

## Objetivo

Até aqui, os alunos só existiam no banco através dos três registros de exemplo criados por `sql/schema.sql` — não havia nenhuma forma, pela própria interface, de cadastrar um novo aluno. Na prática, isso significava recorrer direto ao MySQL Workbench toda vez que uma pessoa nova precisasse pegar um livro emprestado.

Esta aula fecha essa lacuna com uma tela nova — **Cadastrar Aluno** — seguindo exatamente o mesmo caminho já percorrido em **Cadastrar Livro** (Aulas 3 e 11): formulário validado no navegador, `POST` protegido por login no servidor, e validação repetida nos dois lugares.

Como o projeto já tem sessão (Aula 11) e o padrão de cadastro protegido já existe (livros), esta aula é mais curta — é, sobretudo, um exercício de **reconhecer um padrão já aprendido e aplicá-lo de novo**, que é uma habilidade tão importante quanto aprender o padrão em si.

## Pré-requisitos

- Ter concluído as **Aulas 1 a 11**.

## 1. Arquivos novos/alterados nesta aula

```
backend/
└── routes/
    └── alunos.js              → ganhou POST / (protegido por exigirLogin)

frontend/
├── cadastro-aluno.html         → NOVO
├── js/
│   └── cadastro-aluno.js       → NOVO
└── index.html, acervo.html, emprestimos.html,
    cadastro.html, login.html   → menu ganhou o link "Cadastrar Aluno"
```

Repare que a tabela `alunos` já existia desde a Aula 7 (`sql/schema.sql`), com as colunas `nome` e `turma` — não foi preciso nenhuma alteração no banco.

## 2. A rota `POST /api/alunos`

```js
// backend/routes/alunos.js
router.post("/", exigirLogin, async (req, res) => {
  const { nome, turma } = req.body;

  const erros = [];
  if (typeof nome !== "string" || nome.trim().length < 2) {
    erros.push("Informe o nome do aluno (mínimo 2 letras).");
  }
  if (turma !== undefined && turma !== null && String(turma).trim().length > 30) {
    erros.push("A turma pode ter no máximo 30 caracteres.");
  }
  if (erros.length > 0) {
    return res.status(400).json({ erro: erros.join(" ") });
  }

  const turmaNormalizada = turma ? String(turma).trim() : null;

  const [resultado] = await pool.query("INSERT INTO alunos (nome, turma) VALUES (?, ?)", [
    nome.trim(),
    turmaNormalizada,
  ]);
  // ...
});
```

Duas decisões que valem explicar:

- **`turma` é opcional.** Nem toda escola organiza alunos em turmas fixas (bibliotecas de cursos livres, por exemplo) — e mesmo quando organiza, pode fazer sentido cadastrar alguém antes de saber a turma definitiva. Por isso a coluna aceita `NULL` desde a Aula 7, e mantemos essa mesma liberdade aqui.
- **`exigirLogin` de novo.** É o mesmo middleware criado na Aula 11 para `livros` e `emprestimos` — a vantagem de ter extraído aquela lógica para um arquivo próprio (`middlewares/exigirLogin.js`) é justamente poder reaproveitá-la aqui sem reescrever nada, só importando e colocando na rota.

## 3. `cadastro-aluno.html` e `js/cadastro-aluno.js`

Estruturalmente idênticos a `cadastro.html`/`cadastro.js` (Aula 11):

- `protegerPagina()` esconde o formulário e mostra "faça login" para quem não está autenticado.
- `validarFormulario()` confere nome (mínimo 2 letras) e turma (até 30 caracteres) antes de enviar.
- O envio faz `POST /api/alunos` e trata `401` (sessão expirada) do mesmo jeito que `cadastro.js` já tratava.
- Uma tabela "Alunos cadastrados nesta visita" dá feedback imediato, sem precisar ir a outra tela conferir.

Se você comparar os dois arquivos `.js` lado a lado, vai notar que a diferença real está em pouquíssimas linhas — os nomes dos campos e da URL da API. Isso não é coincidência: é o valor de ter estabelecido um **padrão** (validar → mostrar erro → enviar → tratar sucesso/erro/401) nas aulas anteriores. Uma vez que o padrão existe, aplicá-lo a um novo recurso do sistema fica rápido e previsível — tanto para quem programa quanto para quem vai ler o código depois.

## 4. Onde o cadastro de alunos "aparece" no resto do sistema

Não existe (ainda) uma tela de **listagem** de alunos, parecida com a tela **Acervo** para livros. Mas o efeito do cadastro já é visível imediatamente: abra **Empréstimos** depois de cadastrar um aluno novo — ele já aparece no campo "Aluno" do formulário, porque `emprestimos.js` busca a lista atualizada em `GET /api/alunos` toda vez que a página carrega.

## 5. Testando

1. Com o backend rodando (`npm run dev`) e sem estar logado, acesse **Cadastrar Aluno** — o formulário deve estar escondido, com a mensagem pedindo login.
2. Faça login e volte à tela — o formulário deve aparecer.
3. Cadastre um aluno (com e sem turma, em duas tentativas) e confira que ambos aparecem na tabela "Alunos cadastrados nesta visita".
4. Vá até **Empréstimos** e confira que os alunos cadastrados aparecem no seletor "Aluno".
5. Registre um empréstimo para um dos alunos recém-cadastrados, para fechar o ciclo completo.
6. Tente enviar o formulário com o nome vazio (ou só 1 letra) — o erro deve aparecer embaixo do campo, sem chegar a chamar o servidor.

## 6. Desafios para praticar

- Crie uma tela **Alunos** (parecida com **Acervo**), com uma tabela listando todos os alunos cadastrados, consultando `GET /api/alunos`.
- Adicione um campo de busca nessa listagem, filtrando por nome ou turma — reaproveite a lógica de `acervo.js` (`filtrarLivros`).
- Pesquise como impedir o cadastro de um aluno com nome **duplicado** (dica: pense se isso deveria ser uma regra do banco — como o `UNIQUE` do ISBN — ou uma decisão de negócio mais flexível, já que duas pessoas podem ter o mesmo nome de verdade).
- Pense em outros campos que uma biblioteca escolar real poderia precisar (matrícula, e-mail, data de nascimento) e o que mudaria na validação de cada um.

## Próxima aula

Mesma lista de ideias das Aulas 10 e 11: edição/exclusão de registros, paginação, deploy real com HTTPS, testes automatizados, diferentes papéis de usuário — e, agora, também uma tela de listagem/gestão de alunos, espelhando o Acervo.
