# Sistema de Biblioteca Escolar

Projeto didático de um sistema web para controle do acervo e dos empréstimos de uma biblioteca escolar.

Construído **aos poucos**, em aulas, para ensino de desenvolvimento de sistemas. Cada aula tem um documento próprio dentro de `docs/`, com explicação do que foi feito, por quê, e como testar.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript puro (sem frameworks, para fixar bem os fundamentos)
- **Backend:** Node.js + Express
- **Banco de dados:** MySQL

## Estrutura de pastas

```
biblioteca-escolar/
├── docs/                    → material de aula (uma aula por arquivo)
├── frontend/                → tudo que roda no navegador
│   ├── index.html
│   ├── acervo.html
│   ├── cadastro.html
│   ├── cadastro-aluno.html
│   ├── emprestimos.html
│   ├── login.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js               → obterSessaoAtual(), encerrarSessao()
│   │   ├── script.js
│   │   ├── acervo.js
│   │   ├── cadastro.js
│   │   ├── cadastro-aluno.js
│   │   ├── emprestimos.js
│   │   ├── login.js
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
    │   ├── livros.js               → GET / e POST / (protegido)
    │   ├── alunos.js               → GET / e POST / (protegido)
    │   ├── emprestimos.js          → POST / e PUT /:id/devolucao (protegidos)
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

Roteiro concluído — ideias para continuar depois do curso estão no final de `docs/aula-12-cadastro-alunos.md`.

Além do material aula a aula, `docs/conceitos-backend.md` reúne, organizado por assunto (estrutura, configuração, banco de dados, autenticação, integração com o frontend), os conceitos usados na construção do backend — bom para revisão ou para quem quer uma visão geral sem seguir a ordem cronológica das aulas.

## Como rodar o projeto completo

1. Tenha o MySQL instalado e rodando.
2. Dentro de `backend/`: rode o script `sql/schema.sql` no seu MySQL, copie `.env.example` para `.env` e preencha com sua senha e com um `SESSION_SECRET` (qualquer texto longo). Se o banco já existia antes da Aula 11, veja a nota sobre a coluna `isbn` em `docs/aula-11-sessao-e-protecao-de-rotas.md`.
3. Ainda em `backend/`: rode `npm install` e depois `node scripts/criar-usuarios.js` (cria os usuários de teste do login).
4. Rode `npm run dev`.
5. Acesse `http://localhost:3000/` no navegador — **é obrigatório** ser por aqui, e não mais pelo Live Server, porque o login por sessão (Aula 11) depende de frontend e backend serem a mesma origem.

Usuários de teste para o login: `bibliotecaria` / `biblioteca123` ou `aluno1` / `aluno123`.

**Observação:** todas as telas (Acervo, Cadastro de Livro, Cadastrar Aluno, Empréstimos e Login) já são 100% integradas ao MySQL. Desde a Aula 11, **cadastrar livros/alunos e registrar empréstimos/devoluções exige estar logado** — a proteção vale tanto na tela quanto direto na API (rotas protegidas devolvem `401` sem sessão válida). O cadastro de livros também ganhou um campo **ISBN** opcional (13 dígitos, único no banco).
