# Evolução 1 — de projeto didático para uma solução efetiva

As Aulas 1 a 12 (documentadas uma a uma em `docs/aula-NN-*.md`) tinham um
objetivo pedagógico: ensinar, passo a passo, como um sistema web é
construído — frontend, backend, banco de dados, autenticação. Esse roteiro
está concluído.

A partir daqui, o projeto passa a evoluir com outro objetivo: virar uma
ferramenta que uma biblioteca escolar de verdade poderia usar no dia a dia.
Este documento registra a primeira leva de mudanças nessa direção.

## O que mudou

### 1. A página inicial virou a tela de login

Antes, `index.html` era só uma mensagem de boas-vindas genérica, e
`login.html` era uma página separada. Agora:

- `index.html` **é** a tela de login. Quem abre o sistema sem estar
  logado vê o formulário de usuário/senha direto na página inicial.
- Depois de um login com sucesso, a própria página troca o formulário por
  um painel de boas-vindas ("Bem-vindo(a), Ana!"), sem redirecionar — já
  que login e início agora são a mesma tela.
- Em caso de erro (usuário ou senha incorretos), a mensagem aparece no
  próprio formulário, como já acontecia antes.
- Quem já está logado e volta à página inicial vê o painel de boas-vindas
  direto, com atalhos para as outras telas.
- `login.html` e `js/login.js` foram removidos — tudo que faziam está
  agora em `index.html` e no novo `js/inicio.js`. Qualquer link antigo
  para "Entrar" passou a apontar para `index.html`.

### 2. Consultar o acervo agora exige login

Antes, `GET /api/livros` respondia para qualquer um, logado ou não — só
cadastrar exigia sessão. Agora a própria consulta também exige login:
`GET /api/livros`, `GET /api/alunos` e `GET /api/emprestimos` passaram a
usar o middleware `exigirLogin` (o mesmo já usado nas rotas de
escrita desde a Aula 11). Sem sessão válida, essas rotas respondem
`401`, e as telas que dependem delas mostram um aviso pedindo login em
vez de carregar qualquer dado.

### 3. Consulta, empréstimo e devolução viraram uma tela só

`acervo.html` (consulta) e `emprestimos.html` (empréstimo/devolução) eram
duas telas separadas, com uma segunda tabela de "empréstimos ativos"
duplicando informação que já existia no acervo. Agora existe uma única
tela, **Consulta e Empréstimos** (continua no arquivo `emprestimos.html`):

- A busca por título/autor funciona como antes.
- Cada linha da tabela já mostra o status completo: se o livro está
  emprestado, mostra para quem e até quando (e destaca em vermelho se já
  está atrasado).
- Em vez de escolher o livro em uma lista separada, a ação certa aparece
  na própria linha: um livro disponível tem o botão **Emprestar**; um
  livro emprestado tem o botão **Registrar devolução**.
- Clicar em **Emprestar** abre um pequeno painel só para escolher o aluno
  e a data prevista — o livro já vem definido pela linha clicada.
  Clicar em **Registrar devolução** executa a devolução na hora, sem
  formulário.
- O histórico de devoluções continua logo abaixo, como antes.

Para isso, `GET /api/livros` passou a trazer, com um `LEFT JOIN` em
`emprestimos` e `alunos`, os dados do empréstimo ativo de cada livro
(`emprestimoId`, `alunoNome`, `dataPrevista`) quando houver — assim a
tela não precisa mais de uma segunda chamada à API só para saber quem
está com cada livro.

`acervo.html` e `js/acervo.js` foram removidos (o menu "Acervo" não
existe mais — virou parte de "Consulta e Empréstimos").

### 4. Nova tela: Livros em atraso

Página nova, `atrasados.html`, pensada para a bibliotecária acompanhar
rapidamente quem está devendo livro. Lista todos os empréstimos em
aberto, **ordenados pelos mais atrasados primeiro** (quem está devendo
há mais tempo, ou vai vencer primeiro, aparece no topo; quem ainda tem
mais prazo fica embaixo). Cada linha mostra a situação ("Em dia" ou
"Atrasado — N dias") e também tem o botão **Registrar devolução**, para
agilizar o processo sem precisar ir até a outra tela.

Essa tela reaproveita a mesma rota `GET /api/emprestimos` (sem o
parâmetro `status`) que já devolvia os empréstimos ativos ordenados por
`data_prevista ASC` desde a Aula 9 — não foi preciso nenhuma rota nova
nem mudança no banco de dados.

## Como testar

1. Abra `http://localhost:3000/` deslogado — deve aparecer o formulário
   de login direto na página inicial.
2. Tente entrar com usuário/senha errados — deve aparecer o erro no
   próprio formulário, sem sair da página.
3. Entre com `bibliotecaria` / `biblioteca123` — a página deve trocar
   para o painel de boas-vindas, sem recarregar.
4. Abra uma aba anônima (ou saia da sessão) e tente acessar
   `http://localhost:3000/emprestimos.html` ou `atrasados.html`
   diretamente — ambas devem mostrar o aviso pedindo login, sem tabela
   nenhuma visível.
5. Logado, abra **Consulta e Empréstimos**, busque um livro disponível e
   clique em **Emprestar** — escolha um aluno e uma data, confirme, e
   veja a linha do livro mudar para "Emprestado".
6. Na mesma tela, clique em **Registrar devolução** no livro que acabou
   de emprestar — a linha deve voltar para "Disponível" e o registro
   aparecer no histórico, logo abaixo.
7. Abra **Livros em atraso** e confira que os empréstimos aparecem
   ordenados do mais atrasado para o mais recente.

## O que não mudou (por enquanto)

- `cadastro.html` (Cadastrar Livro) e `cadastro-aluno.html` (Cadastrar
  Aluno) continuam exigindo login só para **enviar** o formulário — a
  tela em si continua visível para qualquer pessoa, como já era desde a
  Aula 11/12. Isso pode ser revisto numa próxima evolução, se fizer
  sentido.
- O banco de dados não ganhou nenhuma tabela ou coluna nova nesta
  evolução — tudo foi possível só reorganizando consultas já existentes.
- Não existe ainda diferença de permissão entre "bibliotecária" e
  "aluno" — qualquer usuário cadastrado em `usuarios` pode fazer tudo
  (consultar, emprestar, devolver, cadastrar). Separar isso por papel
  também fica como ideia para uma próxima evolução.
