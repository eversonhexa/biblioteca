# Aula 1 — Estrutura base do frontend

## Objetivo

Criar o esqueleto do projeto: a organização de pastas e a primeira página (`index.html`), com um cabeçalho, um menu de navegação e um rodapé — a "moldura" que vai se repetir em todas as telas do sistema.

Ainda não vamos criar as telas de verdade (acervo, empréstimos etc.). O objetivo desta aula é só a **base visual e estrutural**.

## Pré-requisitos

- Um editor de código (recomendado: [VS Code](https://code.visualstudio.com/))
- Um navegador (Chrome, Edge, Firefox...)
- Não precisa de nada instalado além disso — ainda não usamos Node.js nem banco de dados.

> Dica para o professor: se o VS Code tiver a extensão **Live Server** instalada, os alunos podem clicar com o botão direito no `index.html` e escolher "Open with Live Server" para ver a página atualizando sozinha a cada alteração salva. Sem a extensão, basta abrir o `index.html` normalmente, dando duplo clique nele — funciona igual, só não atualiza sozinho.

## 1. Organização de pastas

Criamos esta estrutura dentro da pasta do projeto:

```
biblioteca-escolar/
├── docs/                → material de aula
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css
    ├── js/
    │   └── script.js
    └── assets/           → aqui entrarão imagens/ícones futuramente
```

**Por que separar em pastas `css` e `js`?** Porque é uma convenção quase universal no desenvolvimento web: mantém o HTML "limpo", focado só na estrutura do conteúdo, enquanto estilo (CSS) e comportamento (JavaScript) ficam em arquivos próprios. Isso facilita manutenção: se algo quebrar visualmente, você sabe que o problema está em `css/`.

## 2. O HTML (`frontend/index.html`)

Alguns pontos importantes do código:

- **`<!DOCTYPE html>`**: informa ao navegador que este é um documento HTML5.
- **`lang="pt-BR"`**: ajuda leitores de tela e o Google a saberem que o conteúdo está em português do Brasil.
- **`<meta name="viewport" ...>`**: essencial para o site se adaptar a celulares — sem essa linha, o site aparece "encolhido" em telas pequenas.
- **Tags semânticas** (`<header>`, `<nav>`, `<main>`, `<footer>`): em vez de usar `<div>` para tudo, usamos tags que descrevem o *significado* daquele bloco. Isso ajuda leitores de tela (acessibilidade) e o próprio navegador a entender a página.
- **Classes com nomes descritivos** (`cabecalho`, `menu__link`, `rodape`): seguimos um estilo parecido com a metodologia **BEM** (Bloco__Elemento--Modificador), muito usada no mercado. Por exemplo, `menu__link--ativo` é uma *variação* do elemento `menu__link` que indica "este é o link da página atual".

Os links do menu (Acervo, Empréstimos, Cadastrar Livro, Entrar) ainda apontam para `#` — são só "placeholders". Vamos apontá-los para páginas de verdade nas próximas aulas.

## 3. O CSS (`frontend/css/style.css`)

O arquivo está dividido em seções numeradas, cada uma explicada com comentários. Os conceitos novos usados:

1. **Reset básico** (`* { margin: 0; padding: 0; box-sizing: border-box; }`): cada navegador tem estilos padrão levemente diferentes para títulos, listas etc. Zerar isso evita surpresas.
2. **Custom properties (variáveis CSS)** (`:root { --cor-primaria: ...; }`): permitem definir um valor uma vez e reutilizá-lo em várias regras com `var(--cor-primaria)`. Se decidirmos trocar a cor da biblioteca inteira, mudamos em um único lugar.
3. **Flexbox** (`display: flex`): usado no cabeçalho e no menu para alinhar itens lado a lado e distribuir o espaço entre eles. É a ferramenta mais comum hoje para esse tipo de alinhamento.
4. **`max-width` + `margin: 0 auto`**: técnica clássica para centralizar o conteúdo na página e impedir que ele fique esticado demais em monitores muito largos.

## 4. O JavaScript (`frontend/js/script.js`)

Só um exemplo simples para começar a praticar a manipulação do **DOM** (a representação da página que o JavaScript consegue ler e alterar):

1. Buscamos o elemento `<span id="ano-atual">` do HTML.
2. Criamos um objeto `Date` com a data de hoje.
3. Colocamos o ano dentro do `<span>`.

Resultado: o rodapé sempre mostra o ano correto, sem precisarmos editar o HTML manualmente todo ano.

## 5. Como testar

1. Abra a pasta `frontend/` no VS Code (`Arquivo → Abrir Pasta`).
2. Abra o `index.html` no navegador (duplo clique no arquivo, ou botão direito → "Open with Live Server").
3. Confirme que aparecem: o cabeçalho verde com o menu, o texto de boas-vindas e o rodapé com o ano atual.
4. Abra o Console do navegador (tecla `F12`, aba "Console") e veja se não há nenhum erro em vermelho.

## 6. Desafios para praticar

Proponha aos alunos, sem dar a resposta pronta:

1. Trocar a cor `--cor-primaria` no CSS e observar tudo que muda automaticamente.
2. Adicionar um novo item no menu, por exemplo "Sobre", apontando para `#`.
3. Usar o `zoom`/redimensionar a janela do navegador (ou abrir o DevTools em modo celular) e observar como o `flex-wrap: wrap` faz o menu quebrar linha em telas estreitas.

## Próxima aula

**Aula 2 — Tela de listagem do acervo**: vamos criar `frontend/acervo.html`, reaproveitando o cabeçalho/rodapé desta aula, e montar uma tabela (ou cards) com livros de exemplo, fixos no HTML por enquanto — a conexão com um banco de dados de verdade vem bem mais adiante.
