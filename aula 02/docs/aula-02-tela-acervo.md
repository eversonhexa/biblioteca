# Aula 2 — Tela de listagem do acervo

## Objetivo

Criar a tela `acervo.html`, que mostra os livros cadastrados em uma tabela, com um campo de busca por título/autor. Os dados ainda são "fixos" (não vêm de um banco de dados) — mas já organizados de um jeito que vai facilitar bastante quando conectarmos ao backend, lá na frente.

## Pré-requisitos

- Ter concluído a **Aula 1** (estrutura base, `index.html`, `style.css`).

## 1. Arquivos novos desta aula

```
frontend/
├── acervo.html              → nova página
├── js/
│   ├── dados-acervo.js       → os livros de exemplo (array de objetos)
│   └── acervo.js             → lógica de renderizar a tabela e buscar
```

E o `style.css` ganhou uma nova seção (nº 7), só com os estilos da tela de acervo.

## 2. Reaproveitando o layout

Repare que `acervo.html` tem o **mesmo cabeçalho e rodapé** de `index.html` — só o `<main>` muda. Isso é proposital: cada tela vai repetir essa mesma "moldura". (Mais adiante, quando conhecermos Node.js, vamos aprender uma forma de evitar repetir esse HTML manualmente em cada arquivo — mas por enquanto, copiar o cabeçalho/rodapé em cada página é normal e ajuda a entender a estrutura.)

O item "Acervo" do menu agora usa a classe `menu__link--ativo` **somente dentro de `acervo.html`** — e o `index.html` foi atualizado para que o link "Acervo" aponte de verdade para `acervo.html`, em vez de `#`.

## 3. Por que os dados dos livros ficam em um arquivo separado?

Em `js/dados-acervo.js` temos:

```js
const listaDeLivros = [
  { id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis", categoria: "Romance", ano: 1899, status: "disponivel" },
  // ...
];
```

Isso é um **array de objetos**: uma lista onde cada item é um objeto com várias propriedades (`titulo`, `autor`, `ano`...). É exatamente assim que vamos pensar nos dados quando eles vierem do banco MySQL — cada linha da tabela do banco vira um objeto igual a esses.

Separar os dados (`dados-acervo.js`) da lógica de exibição (`acervo.js`) é uma decisão importante: quando o backend estiver pronto, vamos trocar **só este arquivo** por uma busca de dados de verdade (`fetch`), e o `acervo.js` praticamente não vai precisar mudar.

## 4. Como a tabela é desenhada (`js/acervo.js`)

Passo a passo do que o script faz:

1. **Pega referências dos elementos do HTML** que vai usar: o `<tbody>` da tabela, o campo de busca e a mensagem de "nada encontrado".
2. **`formatarStatus(status)`**: função pequena que traduz o valor "cru" salvo no objeto (`"disponivel"` ou `"emprestado"`) para um texto amigável e uma classe CSS — separar essa "tradução" em uma função evita repetir esse `if` em vários lugares.
3. **`renderizarLivros(livros)`**: recebe uma lista de livros e:
   - limpa o conteúdo atual do `<tbody>` (`innerHTML = ""`);
   - mostra ou esconde a mensagem de "nenhum livro encontrado" dependendo se a lista está vazia;
   - para cada livro (`forEach`), cria um elemento `<tr>` e usa um **template string** (texto entre crases `` ` `` que permite `${variavel}` no meio) para montar as células.
4. **`filtrarLivros(termo)`**: usa o método de array `.filter()` para devolver só os livros cujo título ou autor contêm o termo digitado (comparação em minúsculas, para "machado" encontrar "Machado").
5. **`addEventListener("input", ...)`**: "escuta" o campo de busca. A cada tecla digitada, filtra a lista original e manda renderizar de novo.
6. Na última linha, chamamos `renderizarLivros(listaDeLivros)` uma vez, para a tabela já aparecer preenchida assim que a página carrega.

> **Conceito novo — DOM dinâmico:** até a Aula 1, o HTML era 100% escrito à mão. Agora, as linhas da tabela (`<tr>`) **não existem no HTML** — o `<tbody>` começa vazio e é o JavaScript quem cria os elementos em tempo real, com base nos dados. Essa é a mesma ideia usada por praticamente todo sistema que lista dados vindos de um banco.

## 5. O CSS novo (seção 7 do `style.css`)

- **`border-collapse: collapse`**: uma propriedade específica de tabelas, que evita bordas duplicadas entre as células.
- **`.badge` com `border-radius: 999px`**: um valor de borda bem maior que o necessário sempre vira um formato de "pílula"/cápsula — truque comum para criar selos e etiquetas.
- **`.tabela tbody tr:hover`**: destaca a linha embaixo do mouse, melhorando a leitura de tabelas com muitas linhas.

## 6. Como testar

1. Abra `frontend/index.html`, clique em "Acervo" no menu.
2. Confira se aparecem os 10 livros de exemplo na tabela, com o selo verde ("Disponível") ou vermelho ("Emprestado") na última coluna.
3. Digite no campo de busca, por exemplo `machado` — a tabela deve filtrar em tempo real, mostrando só os livros de Machado de Assis.
4. Apague o texto da busca — todos os livros devem voltar a aparecer.
5. Digite algo que não existe (ex.: `xablau`) — deve aparecer a mensagem "Nenhum livro encontrado com esse termo de busca."

## 7. Desafios para praticar

1. Adicionar mais 2 ou 3 livros no array `listaDeLivros` e testar se aparecem na tabela.
2. Fazer a busca também considerar a **categoria** do livro (dica: é só adicionar mais uma condição dentro do `.filter()`).
3. Adicionar um `<select>` no HTML para filtrar por status (Todos / Disponível / Emprestado), combinando esse filtro com o texto da busca.

## Próxima aula

**Aula 3 — Tela de cadastro de livros**: vamos criar um formulário (`cadastro.html`) para adicionar um novo livro à lista, revisando conceitos de formulários HTML (`<form>`, `<input>`, validação) e eventos de `submit` em JavaScript.
