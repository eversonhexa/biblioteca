# Sistema de Biblioteca Escolar

Projeto didático de um sistema web para controle do acervo e dos empréstimos de uma biblioteca escolar.

Construído **aos poucos**, em aulas, para ensino de desenvolvimento de sistemas (Aulas 1 a 12, documentadas uma a uma em `docs/aula-NN-*.md`). Esse roteiro didático está concluído — o projeto agora está evoluindo para uma solução efetiva, pensada para o uso real de uma biblioteca escolar. Cada evolução também ganha um documento próprio em `docs/`, explicando o que mudou, por quê, e como testar.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript puro (sem frameworks, para fixar bem os fundamentos)
- **Backend:** Node.js + Express
- **Banco de dados:** MySQL

## Estrutura de pastas

```
biblioteca-escolar/
├── docs/                    → material de aula (uma aula por arquivo)
├── frontend/                → tudo que roda no navegador
│   ├── index.html              → tela inicial E tela de login (painel de boas-vindas quando já logado)
│   ├── cadastro.html
│   ├── cadastro-aluno.html
│   ├── emprestimos.html        → Consulta e Empréstimos: busca + empréstimo + devolução numa tela só
│   ├── atrasados.html          → Livros em atraso, ordenados pelo mais atrasado primeiro
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js               → obterSessaoAtual(), encerrarSessao()
│   │   ├── script.js
│   │   ├── inicio.js              → lógica da tela inicial/login
│   │   ├── cadastro.js
│   │   ├── cadastro-aluno.js
│   │   ├── emprestimos.js
│   │   ├── atrasados.js
│   │   ├── dados-acervo.js      → histórico (nenhuma tela usa mais)
│   │   └── dados-usuarios.js     → histórico (nenhuma tela usa mais)
│   └── assets/               → imagens, ícones etc.
└── backend/                  → servidor Node.js (API)
    ├── package.json
    ├── server.js               → monta os routers + serve o frontend + sessão
    ├── db.js                    → conexão com o MySQL
    ├── .env.example              → modelo das variáveis de ambiente (copie para .env)
    ├── middlewares/
    │   └── exigirLogin.js        → exige sessão válida (401 se não houver)
    ├── routes/
    │   ├── livros.js               → GET / (protegido; já traz quem pegou cada livro emprestado) e POST / (protegido)
    │   ├── alunos.js               → GET / e POST / (protegidos)
    │   ├── emprestimos.js          → GET / (protegido), POST / e PUT /:id/devolucao (protegidos)
    │   └── auth.js               → POST /api/login, GET /api/sessao, POST /api/logout
    ├── utils/
    │   ├── senha.js               → hash/verificação de senha
    │   └── data.js
    ├── scripts/
    │   └── criar-usuarios.js      → cria/reseta os usuários de teste
    ├── sql/
    │   └── schema.sql             → cria o banco e as tabelas
    └── dados-livros.js            → histórico (não é mais usado)
```

## Roteiro do projeto

- [x] **Aula 1** — Estrutura base do frontend (pastas, HTML semântico, layout em CSS)
- [x] **Aula 2** — Tela de listagem do acervo (catálogo de livros)
- [x] **Aula 3** — Tela de cadastro de livros
- [x] **Aula 4** — Tela de controle de empréstimos
- [x] **Aula 5** — Tela de login (simulada, sem backend)
- [x] **Aula 6** — Início do backend com Node.js (servidor e rotas)
- [x] **Aula 7** — Banco de dados MySQL (modelagem e conexão)
- [x] **Aula 8** — Integração frontend + backend (tela de Acervo consumindo a API)
- [x] **Aula 9** — Empréstimos e devoluções na prática (regras de negócio no backend)
- [x] **Aula 10** — Ajustes finais, autenticação e implantação (deploy)
- [x] **Aula 11** — Sessão de verdade e proteção das rotas (login passa a valer entre páginas; cadastro de livros passa a gravar no banco)
- [x] **Aula 12** — Cadastro de alunos (mesmo padrão de Cadastrar Livro, aplicado a um novo recurso)

Roteiro didático concluído — ideias que estavam no final de `docs/aula-12-cadastro-alunos.md` já viraram a primeira evolução abaixo.

### Evolução para uma solução efetiva

- [x] **Evolução 1** — Página inicial vira a tela de login (com mensagem de boas-vindas/erro); consulta ao acervo passa a exigir login; consulta, empréstimo e devolução viram uma tela só; nova tela de livros em atraso. Detalhes em `docs/evolucao-01-tela-inicial-e-consulta-unificada.md`.

Além do material aula a aula, `docs/conceitos-backend.md` reúne, organizado por assunto (estrutura, configuração, banco de dados, autenticação, integração com o frontend), os conceitos usados na construção do backend — bom para revisão ou para quem quer uma visão geral sem seguir a ordem cronológica das aulas.

Para uma aula teórico-expositiva (sem codificação ao vivo), `docs/roteiro-aula-fluxo-de-requisicao.md` traz um roteiro pronto — com tempo sugerido por bloco e perguntas de verificação — narrando o caminho completo de uma requisição real do sistema, do clique no navegador até a resposta do banco de dados voltar para a tela.

Para levar o projeto para outros computadores (ex.: um laboratório de informática, com cada máquina rodando sua própria cópia), `docs/guia-instalacao-laboratorio.md` tem o passo a passo completo, do empacotamento da pasta até o checklist de conferência em cada computador.

## Como rodar o projeto completo

1. Tenha o MySQL instalado e rodando.
2. Dentro de `backend/`: rode o script `sql/schema.sql` no seu MySQL, copie `.env.example` para `.env` e preencha com sua senha e com um `SESSION_SECRET` (qualquer texto longo). Se o banco já existia antes da Aula 11, veja a nota sobre a coluna `isbn` em `docs/aula-11-sessao-e-protecao-de-rotas.md`.
3. Ainda em `backend/`: rode `npm install` e depois `node scripts/criar-usuarios.js` (cria os usuários de teste do login).
4. Rode `npm run dev`.
5. Acesse `http://localhost:3000/` no navegador — **é obrigatório** ser por aqui, e não mais pelo Live Server, porque o login por sessão (Aula 11) depende de frontend e backend serem a mesma origem. Essa também já é a tela de login, desde a Evolução 1.

Usuários de teste para o login: `bibliotecaria` / `biblioteca123` ou `aluno1` / `aluno123`.

**Observação:** todas as telas já são 100% integradas ao MySQL. Desde a Evolução 1, **consultar o acervo também exige estar logado** (antes, só cadastrar/emprestar/devolver exigia) — a proteção vale tanto na tela quanto direto na API (rotas protegidas devolvem `401` sem sessão válida). O cadastro de livros tem um campo **ISBN** opcional (13 dígitos, único no banco).
