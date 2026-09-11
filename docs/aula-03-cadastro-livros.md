# Aula 3 — Formulário de cadastro de livros

## Objetivo

Criar a tela `cadastro.html`, com um formulário para adicionar um novo livro, incluindo validação dos campos e feedback visual (mensagens de sucesso/erro) — tudo ainda sem backend, guardando os dados só na memória da página.

## Pré-requisitos

- Ter concluído as **Aulas 1 e 2**.

## 1. Arquivos novos desta aula

```
frontend/
├── cadastro.html             → nova página
└── js/
    └── cadastro.js            → validação e lógica do formulário
```

E o `style.css` ganhou a seção nº 8, com os estilos do formulário, dos campos com erro e das faixas de alerta.

Os links "Cadastrar Livro" do menu, em `index.html` e `acervo.html`, agora apontam para `cadastro.html` (antes eram só `#`).

## 2. Por que um aviso dizendo que os dados não persistem?

Este é um ponto importante da aula: os livros cadastrados aqui ficam guardados só em um array (`livrosCadastrados`) **na memória do navegador**, enquanto a página estiver aberta. Se você recarregar a página, ou for para outra tela, essa lista some.

Isso é **proposital**: mostra na prática por que, mais para frente no curso, vamos precisar de um servidor (Node.js) e um banco de dados (MySQL) — para os dados sobreviverem além de uma única visita à página. Guarde essa sensação de "cadastrei, mas sumiu" — ela vai ficar bem clara quando resolvermos o problema, lá na Aula 8.

## 3. O formulário HTML (`cadastro.html`)

Pontos novos em relação às aulas anteriores:

- **`<form id="form-cadastro" novalidate>`**: o atributo `novalidate` desliga os balõezinhos de erro padrão do navegador (que variam de idioma e aparência conforme o navegador/sistema). Vamos mostrar nossas próprias mensagens, em português, com a cara do nosso site — mas a validação continua acontecendo, só que escrita por nós em JavaScript.
- **`<label for="titulo">`** + **`<input id="titulo">`**: o `for` do label precisa bater com o `id` do campo. Isso faz o label ser clicável (clicar no texto "Título" foca o campo) e é essencial para acessibilidade (leitores de tela).
- **`<select>`** para a categoria: quando as opções são um conjunto fechado e conhecido, um `<select>` é melhor que um campo de texto livre — evita erros de digitação como "romance" vs "Romance" vs "Romances".
- **`<input type="number" min="1000" max="2026">`**: tipo de campo apropriado para números, com teclado numérico em celulares e setinhas de incremento no desktop.
- **`<small class="campo__erro">`** vazio embaixo de cada campo: é onde o JavaScript vai escrever a mensagem de erro, se houver.

## 4. A validação em JavaScript (`js/cadastro.js`)

Por que validar "na mão" em vez de confiar só nos atributos `required`/`min`/`max` do HTML? Porque:

1. Queremos mensagens de erro em português, no nosso estilo visual;
2. É o mesmo raciocínio que vamos aplicar depois no **backend** — nunca confiar cegamente nos dados que chegam, mesmo que o formulário já valide no navegador (um usuário mal-intencionado pode enviar dados sem passar pelo formulário).

Passo a passo do `cadastro.js`:

1. **`mostrarErroDoCampo(idCampo, mensagem)`**: escreve a mensagem dentro do `<small>` correspondente e adiciona uma classe CSS (`campo__input--invalido`) que deixa a borda do campo vermelha.
2. **`limparErros()`**: roda antes de cada nova tentativa de validação, apagando mensagens e classes de erro anteriores — sem isso, um erro corrigido continuaria aparecendo na tela.
3. **`validarFormulario()`**: lê o valor de cada campo, aplica as regras (tamanho mínimo do título/autor, categoria selecionada, ano dentro do intervalo) e devolve:
   - `null`, se algum campo estiver errado (e já mostrou as mensagens); ou
   - um objeto `{ titulo, autor, categoria, ano }` com os dados "limpos" (sem espaços extras), se estiver tudo certo.
4. **Evento `submit`**: primeiro chama `evento.preventDefault()` — sem essa linha, o navegador tentaria recarregar a página ao enviar o formulário (comportamento padrão de HTML puro, pensado para quando existe um servidor recebendo os dados). Depois valida; se estiver tudo certo, monta o objeto do livro, adiciona no array, redesenha a tabela e mostra o alerta de sucesso; senão, mostra o alerta de erro.

> **Conceito novo — spread de objeto (`...dadosValidados`):** `{ id: Date.now(), ...dadosValidados, status: "disponivel" }` cria um novo objeto copiando todas as propriedades de `dadosValidados` (título, autor, categoria, ano) e adicionando `id` e `status`. É uma forma compacta de "misturar" objetos.

## 5. Como testar

1. Vá em "Cadastrar Livro" no menu.
2. Clique em "Cadastrar" com o formulário vazio — todos os campos devem mostrar mensagem de erro e ficar com a borda vermelha.
3. Preencha só o título com 1 letra — deve continuar dando erro nesse campo (mínimo de 2 letras).
4. Preencha tudo corretamente e envie — deve aparecer a faixa verde de sucesso, o formulário deve limpar, e uma nova linha deve aparecer na tabela "Livros cadastrados nesta sessão".
5. Recarregue a página (F5) — confirme que a tabela volta vazia (é o comportamento esperado, explicado na seção 2).

## 6. Desafios para praticar

1. Adicionar um campo opcional de "Número de páginas" (`type="number"`, sem `required`).
2. Impedir o cadastro de um ano no futuro sem precisar editar o `max` do HTML todo ano (dica: já fizemos isso — reveja como `anoAtual` é calculado em `validarFormulario`).
3. Adicionar um botão "Limpar" (`type="reset"`) ao lado do botão "Cadastrar".

## Próxima aula

**Aula 4 — Tela de controle de empréstimos**: vamos criar `emprestimos.html`, permitindo registrar o empréstimo de um livro (associando um livro do acervo a um aluno) e marcar devoluções — ainda com dados simulados, preparando o terreno para as regras de negócio que serão validadas de verdade no backend.
