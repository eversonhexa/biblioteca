# Sistema de Biblioteca Escolar

Projeto didático de um sistema web para controle do acervo e dos empréstimos de uma biblioteca escolar.

Construído **aos poucos**, em aulas, para ensino de desenvolvimento de sistemas. Cada aula tem um documento próprio dentro de `docs/`, com explicação do que foi feito, por quê, e como testar.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript puro (sem frameworks, para fixar bem os fundamentos)
- **Backend:** Node.js (mais adiante)
- **Banco de dados:** MySQL (mais adiante)

## Estrutura de pastas

```
biblioteca-escolar/
├── docs/                    → material de aula (uma aula por arquivo)
├── frontend/                → tudo que roda no navegador
│   ├── index.html
│   ├── acervo.html
│   ├── cadastro.html
│   ├── emprestimos.html
│   ├── login.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── script.js
│   │   ├── dados-acervo.js
│   │   ├── acervo.js
│   │   ├── cadastro.js
│   │   ├── emprestimos.js
│   │   ├── dados-usuarios.js
│   │   └── login.js
│   └── assets/               → imagens, ícones etc.
└── backend/                  → servidor Node.js (API)
    ├── package.json
    ├── server.js
    └── dados-livros.js
```

## Roteiro do projeto

- [x] **Aula 1** — Estrutura base do frontend (pastas, HTML semântico, layout em CSS)
- [x] **Aula 2** — Tela de listagem do acervo (catálogo de livros)
- [x] **Aula 3** — Tela de cadastro de livros
- [x] **Aula 4** — Tela de controle de empréstimos
- [x] **Aula 5** — Tela de login (simulada, sem backend)
- [x] **Aula 6** — Início do backend com Node.js (servidor e rotas)
- [ ] Aula 7 — Banco de dados MySQL (modelagem e conexão)
- [ ] Aula 8 — Integração frontend + backend (consumindo a API)
- [ ] Aula 9 — Empréstimos e devoluções na prática (regras de negócio)
- [ ] Aula 10 — Ajustes finais, autenticação e implantação (deploy)

Esse roteiro pode mudar conforme o andamento das aulas.

## Como abrir o projeto até agora

- **Frontend:** é só HTML/CSS/JS estático, então basta abrir o arquivo `frontend/index.html` no navegador. Instruções detalhadas em `docs/aula-01-estrutura-base.md`.
- **Backend:** dentro da pasta `backend/`, rode `npm install` (só na primeira vez) e depois `npm run dev`. O servidor sobe em `http://localhost:3000`. Instruções detalhadas em `docs/aula-06-node-intro.md`. O frontend ainda não consome esse servidor — isso começa na Aula 8.
