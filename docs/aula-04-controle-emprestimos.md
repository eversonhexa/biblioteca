# Aula 4 — Tela de controle de empréstimos

## Objetivo

Criar a tela `emprestimos.html`, que permite registrar o empréstimo de um livro disponível a um aluno, listar os empréstimos ativos e registrar devoluções — atualizando, em tempo real, a disponibilidade do livro.

Esta é a aula em que as três telas do frontend começam a **conversar entre si**: o empréstimo só pode acontecer se o livro estiver com status `"disponivel"` no array `listaDeLivros`, o mesmo array usado pela tela de Acervo.

## Pré-requisitos

- Ter concluído as **Aulas 1, 2 e 3**.

## 1. Arquivos novos desta aula

```
frontend/
├── emprestimos.html          → nova página
└── js/
    └── emprestimos.js         → toda a lógica de empréstimo/devolução
```

`emprestimos.html` carrega `js/dados-acervo.js` **antes** de `js/emprestimos.js` — precisamos do array `listaDeLivros` já existir antes do nosso script usá-lo.

O `style.css` ganhou um botão secundário (`.botao--secundario`, usado no "Registrar devolução") e um título de seção reaproveitado da Aula 3.

## 2. A regra de negócio desta aula

> Só é possível emprestar um livro que esteja **disponível**. Ao confirmar o empréstimo, o livro passa a **emprestado** (some da lista de opções). Ao registrar a devolução, ele volta a ficar **disponível**.

Isso é a primeira "regra de negócio" de verdade do sistema — uma condição que faz sentido para o mundo real da biblioteca, não só uma validação de formulário. Guarde essa ideia: quando construirmos o backend, essa mesma regra vai ser reforçada lá também (nunca confiamos só na validação do frontend para regras importantes).

## 3. Preenchendo o `<select>` de livros dinamicamente

Repare que, no HTML, o `<select id="livro">` começa com só uma opção ("Selecione um livro disponível"). As demais opções são criadas pela função `popularSelectDeLivros()`, em `emprestimos.js`:

```js
function popularSelectDeLivros() {
  selectLivro.length = 1; // mantém só a primeira opção, remove o resto
  const livrosDisponiveis = listaDeLivros.filter((livro) => livro.status === "disponivel");
  livrosDisponiveis.forEach((livro) => {
    const opcao = document.createElement("option");
    opcao.value = livro.id;
    opcao.textContent = `${livro.titulo} — ${livro.autor}`;
    selectLivro.appendChild(opcao);
  });
}
```

Essa função é chamada três vezes: quando a página carrega, depois de registrar um empréstimo (o livro escolhido precisa sumir da lista) e depois de registrar uma devolução (o livro precisa voltar a aparecer).

> **Truque:** `selectLivro.length = 1` é um jeito rápido de "cortar" as opções extras de um `<select>`, mantendo só a primeira (índice 0).

## 4. Trabalhando com datas

Dois formatos de data aparecem neste código:

- **`AAAA-MM-DD`** (ex.: `2026-09-11`): é o formato que o `<input type="date">` usa internamente, e também o formato que vamos usar quando guardarmos datas no MySQL, mais adiante.
- **`DD/MM/AAAA`** (ex.: `11/09/2026`): formato "brasileiro", usado só na hora de mostrar a data na tela.

As funções `obterDataHojeISO()` e `formatarDataBR()` cuidam dessa conversão nos dois sentidos. Um detalhe importante: como o formato `AAAA-MM-DD` tem sempre o mesmo tamanho, dá para comparar duas datas nesse formato como se fossem texto (`dataPrevista < hojeISO`) e o resultado é correto — é assim que validamos que a devolução prevista não pode ser no passado.

## 5. Registrando o empréstimo

O fluxo do `submit` do formulário segue o mesmo padrão da Aula 3 (`evento.preventDefault()`, validar, se ok: agir e mostrar alerta de sucesso), com uma novidade: além de guardar o empréstimo em `emprestimosAtivos`, o código também **muda o status do livro**:

```js
livro.status = "emprestado";
```

Como `livro` é uma referência ao mesmo objeto que está dentro de `listaDeLivros` (arrays e objetos em JavaScript são "compartilhados" quando você pega um item deles com `.find()`), essa linha já é suficiente para atualizar o array inteiro.

## 6. Registrando a devolução — delegação de eventos

A tabela de empréstimos ativos tem um botão "Registrar devolução" **em cada linha**. Só que essas linhas são recriadas toda vez que a tabela é redesenhada — se colocássemos um `addEventListener` em cada botão individualmente, teríamos que repetir isso a cada renderização.

A solução é a **delegação de eventos**: colocamos um único listener no `<tbody>` (que não muda) e, quando ele é clicado, descobrimos qual botão foi de fato clicado:

```js
corpoTabelaAtivos.addEventListener("click", (evento) => {
  const botao = evento.target.closest("button[data-id]");
  if (!botao) return; // clicou em outro lugar da tabela, ignora
  const idClicado = Number(botao.dataset.id);
  // ...
});
```

- **`evento.target`** é o elemento exato que recebeu o clique (pode ser o próprio botão, ou algo dentro dele).
- **`.closest("button[data-id]")`** sobe pela árvore do HTML até achar o botão mais próximo com o atributo `data-id`.
- **`data-id="${emprestimo.id}"`** no HTML vira `botao.dataset.id` no JavaScript — é assim que "marcamos" cada botão com o id do empréstimo que ele representa.

Ao confirmar a devolução: removemos o empréstimo de `emprestimosAtivos` (com `splice`), adicionamos a data de devolução, colocamos no início do `historicoDevolucoes` (com `unshift`, que adiciona no começo do array) e devolvemos o livro para `"disponivel"`.

## 7. Como testar

1. Vá em "Empréstimos" no menu.
2. Escolha um livro, digite um nome de aluno, escolha uma data de devolução prevista e clique em "Registrar empréstimo".
3. Confirme que: apareceu uma linha na tabela "Empréstimos ativos"; o alerta verde de sucesso apareceu; o livro escolhido **sumiu** do select (tente abrir o select de novo).
4. Vá até "Acervo" — confira que o livro emprestado aparece com o selo vermelho "Emprestado" (o array `listaDeLivros` é o mesmo usado pelas duas telas, mas lembre-se: como não recarregamos via backend, isso só funciona porque as duas páginas rodam na mesma "sessão" de navegação — ao **recarregar** a página, os dados voltam ao estado inicial).
5. Volte em "Empréstimos" e clique em "Registrar devolução" na linha do empréstimo — ele deve sumir dos ativos e aparecer no "Histórico de devoluções", e o livro deve voltar a aparecer no select.
6. Tente escolher uma data de devolução no passado — deve dar erro de validação.

## 8. Desafios para praticar

1. Impedir que o mesmo aluno tenha dois empréstimos ativos ao mesmo tempo (dica: antes de registrar, procure em `emprestimosAtivos` por algum item com o mesmo `aluno`).
2. Destacar visualmente (ex.: texto vermelho) os empréstimos da tabela "ativos" cuja `dataPrevista` já passou (atraso na devolução).
3. Adicionar um botão "Cancelar empréstimo" que devolve o livro sem registrar no histórico (para o caso de um erro de cadastro).

## Próxima aula

**Aula 5 — Tela de login**: vamos criar `login.html`, com um formulário de usuário e senha e uma validação simulada (sem backend ainda), preparando a estrutura para a autenticação de verdade que virá com Node.js.
