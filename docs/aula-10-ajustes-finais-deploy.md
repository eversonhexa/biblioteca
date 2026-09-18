# Aula 10 — Ajustes finais, autenticação e implantação

## Objetivo

Fechar o curso com três frentes:

1. Trocar o login simulado (Aula 5) por autenticação de verdade, com senha protegida por hash no banco.
2. Organizar o código do backend, que já estava crescendo (rotas separadas por arquivo).
3. Entender como colocar o sistema no ar — inclusive uma forma concreta e simples de rodar isso numa rede de laboratório de escola.

## Pré-requisitos

- Ter concluído as **Aulas 1 a 9**.

## 1. Arquivos alterados/novos nesta aula

```
backend/
├── utils/
│   ├── senha.js             → hash e verificação de senha (crypto nativo do Node)
│   └── data.js                → obterDataHojeISO(), movida para cá
├── routes/
│   ├── livros.js
│   ├── alunos.js
│   ├── emprestimos.js
│   └── auth.js                → POST /api/login
├── scripts/
│   └── criar-usuarios.js      → cria/reseta os usuários de teste, com senha em hash
├── sql/schema.sql              → nova tabela "usuarios"
└── server.js                   → bem mais enxuto: monta os routers + serve o frontend

frontend/
├── login.html                  → aviso atualizado; removida a tag de dados-usuarios.js
└── js/
    ├── login.js                 → chama POST /api/login, em vez de comparar um array
    └── dados-usuarios.js         → agora é 100% histórico
```

## 2. Hash de senha, sem instalar nada

Diferente das outras aulas, aqui **não precisamos instalar nenhum pacote novo**. Usamos o módulo `crypto`, que já vem embutido no Node.js, com o algoritmo **scrypt** — feito especificamente para senhas (de propósito lento e "pesado", o que atrapalha ataques de força bruta).

```js
const salt = crypto.randomBytes(16).toString("hex");
crypto.scrypt(senha, salt, 64, (erro, chaveDerivada) => { ... });
```

- **`salt`** ("tempero"): um valor aleatório, diferente para cada usuário, misturado à senha antes do hash. Sem o salt, duas pessoas com a mesma senha teriam o mesmo hash gravado — e um invasor poderia usar uma lista pronta de hashes de senhas comuns (*rainbow table*) para descobrir senhas em massa. Com salt, isso deixa de funcionar.
- Guardamos `salt:hash` como uma única string em `senha_hash` — é assim que conseguimos, no login, refazer o mesmo cálculo e comparar.
- **`crypto.timingSafeEqual`**: usada em vez de `===` para comparar os hashes, porque compara byte a byte em tempo **constante**. Isso evita um *timing attack*: sem essa proteção, alguém medindo com precisão quantos microssegundos a comparação levou poderia, aos poucos, descobrir quantos caracteres já acertou.

> Em projetos profissionais é comum usar uma biblioteca pronta como `bcrypt` ou `argon2`, que empacotam essas boas práticas (e mais algumas) prontas para uso. Fizemos "na mão" aqui, com `crypto`, justamente para você enxergar os conceitos por trás — mas o raciocínio (salt + hash lento + comparação seg
ura) é o mesmo.

## 3. O script `criar-usuarios.js`

Rode, uma vez, dentro de `backend/`:

```
node scripts/criar-usuarios.js
```

Ele cria (ou atualiza a senha de) os dois usuários de teste, já com hash — nunca com a senha em texto puro. Pode rodar de novo sempre que quiser "resetar" a senha de teste.

Repare que este script **não é uma rota da API** — é um programinha avulso que você roda manualmente, direto no terminal, quando precisa. É um padrão comum em backends reais: scripts de manutenção/administração que ficam fora do fluxo normal de requisições HTTP.

## 4. A rota `POST /api/login`

```js
const [linhas] = await pool.query("SELECT * FROM usuarios WHERE usuario = ?", [usuario]);
if (linhas.length === 0) return res.status(401).json({ erro: "Usuário ou senha inválidos." });

const senhaCorreta = await verificarSenha(senha, linhas[0].senha_hash);
if (!senhaCorreta) return res.status(401).json({ erro: "Usuário ou senha inválidos." });
```

Note o status `401 Unauthorized` — o código HTTP apropriado para "credenciais inválidas" (diferente do `400`, que seria "o pedido está malformado", ou `403`, que seria "você não tem permissão para isso", mesmo autenticado).

**O que este login ainda NÃO faz:** manter você "logado" entre páginas ou depois de recarregar. Um sistema real, depois do login, cria uma **sessão** (com cookies) ou um **token** (JWT é o mais comum hoje) para o navegador provar, nos próximos pedidos, que aquele usuário já se autenticou — sem precisar mandar usuário/senha de novo a cada clique. Isso é um assunto rico o suficiente para um curso à parte; fica como próximo passo natural depois deste.

## 5. Organizando as rotas com `express.Router()`

O `server.js` estava crescendo a cada aula. Agora cada assunto tem seu próprio arquivo dentro de `routes/`:

```js
// routes/livros.js
const router = express.Router();
router.get("/", async (req, res) => { ... });
module.exports = router;
```

```js
// server.js
const rotasLivros = require("./routes/livros");
app.use("/api/livros", rotasLivros);
```

`app.use("/api/livros", rotasLivros)` diz: "toda rota definida dentro de `rotasLivros` vive, na prática, dentro de `/api/livros`". Por isso, dentro do arquivo, a rota é só `router.get("/", ...)` — o prefixo é responsabilidade de quem "monta" o router, não do arquivo em si. Isso deixa o código mais fácil de navegar (quer mexer em empréstimos? vá direto em `routes/emprestimos.js`) e evita um único arquivo gigante.

## 6. O Express passou a servir o frontend

```js
app.use(express.static(path.join(__dirname, "..", "frontend")));
```

A partir de agora, o mesmo processo Node que responde `/api/livros` também entrega `index.html`, `style.css`, os arquivos `.js` etc. Teste: com o backend rodando, acesse `http://localhost:3000/` direto no navegador — o site completo deve aparecer, **sem precisar do Live Server**.

Isso é exatamente como a maioria dos sites pequenos/médios funciona em produção: **um único servidor**, servindo tanto os arquivos estáticos quanto a API. (Durante o desenvolvimento, usar o Live Server continua sendo útil, por causa do recarregamento automático a cada salvamento — por isso não removemos essa opção, só adicionamos a alternativa.)

## 7. O que muda ao servir tudo pela mesma origem

Enquanto o frontend é aberto pelo Live Server (`http://127.0.0.1:5500`) e o backend responde em `http://localhost:3000`, são origens diferentes — por isso precisamos do CORS desde a Aula 8. Quando é o **próprio Express** servindo o frontend em `http://localhost:3000/`, os dois passam a ser a **mesma origem** — o CORS deixa de ser estritamente necessário nesse cenário (mas não faz mal manter, para continuar funcionando também com o Live Server).

## 8. Implantação (deploy): a versão que cabe numa escola

"Colocar no ar" não precisa significar "publicar na internet". Para um sistema de uso interno, como a biblioteca de uma escola, o cenário mais realista é: **rodar o servidor em UM computador do laboratório, e deixar os outros computadores da mesma rede acessarem por ele.**

Isso já funciona hoje, com uma ressalva importante sobre o endereço usado:

1. No computador que vai "hospedar" o sistema, descubra o IP local dele. No Windows, abra o Prompt de Comando e rode `ipconfig` — procure por "Endereço IPv4" (algo como `192.168.0.15`).
2. Garanta que o Firewall do Windows permite conexões de entrada na porta 3000 para o Node.js (na primeira vez que você roda `npm run dev`, o Windows costuma perguntar se permite o acesso — aceite para redes privadas).
3. Rode `npm run dev` normalmente.
4. Em **outro** computador da mesma rede, abra o navegador e acesse `http://192.168.0.15:3000` (troque pelo IP real) — o site deve carregar.

**A pegadinha:** todo o nosso frontend chama a API usando `http://localhost:3000/...`, fixo, em cada arquivo `.js`. Isso funciona perfeitamente quando frontend e backend estão na MESMA máquina de quem está usando — mas "localhost", visto de outro computador, significa "esse outro computador", não o servidor. Ou seja: abrir `http://192.168.0.15:3000` em outro PC vai carregar a página, mas os `fetch("http://localhost:3000/api/...")` dentro dela vão tentar falar com o Node.js do PRÓPRIO computador que abriu a página (que não existe lá) — e vão falhar.

## 9. Desafio final do curso: URLs relativas

Este é o ajuste final, de verdade, para o sistema funcionar em qualquer computador da rede sem editar código a cada vez. A ideia: trocar as URLs fixas (`http://localhost:3000/api/livros`) por **URLs relativas** (`/api/livros`) em todos os arquivos `.js` do frontend que fazem `fetch`:

- `frontend/js/acervo.js`
- `frontend/js/emprestimos.js`
- `frontend/js/login.js`

Uma URL relativa como `/api/livros` é resolvida pelo navegador **em relação à página que a pediu** — então, se a página foi carregada de `http://192.168.0.15:3000/acervo.html`, o `fetch("/api/livros")` automaticamente vira `http://192.168.0.15:3000/api/livros`. Funciona em qualquer máquina, sem editar nada, **desde que o frontend seja aberto a partir do próprio Express** (seção 6 acima) — e não mais pelo Live Server, que é exatamente a mudança que fizemos nesta aula.

Passo a passo:
1. Em cada um dos três arquivos, troque a constante (ex.: `const URL_API_LIVROS = "http://localhost:3000/api/livros";`) para `const URL_API_LIVROS = "/api/livros";` (e o mesmo para as outras URLs de API).
2. Pare o Live Server, se estiver usando. Acesse tudo a partir de `http://localhost:3000/` (servido pelo próprio Express).
3. Teste o fluxo completo de novo (Acervo, Empréstimos, Login).
4. Se tiver outro computador na mesma rede, teste acessando pelo IP local, como na seção 8.

## 10. Outras ideias para continuar depois do curso

O sistema está funcional e com uma base sólida, mas um projeto real nunca "termina". Algumas direções naturais para continuar evoluindo, sozinho ou com a turma:

- Sessões/tokens (JWT) para o login manter o usuário autenticado entre páginas.
- Edição e exclusão de livros/alunos (rotas `PUT`/`DELETE`, telas de edição).
- Paginação na listagem do acervo, para catálogos grandes.
- Deploy de verdade na internet (ex.: um servidor com Node.js + MySQL em um provedor de nuvem), com HTTPS.
- Testes automatizados (ex.: com Jest) para as rotas da API.

## Fim do curso

Ao longo de 10 aulas, este projeto passou de um HTML estático a um sistema completo: frontend, backend com API REST, banco de dados relacional, regras de negócio protegidas no servidor, e autenticação com hash de senha. Esse é o ciclo completo de desenvolvimento de um sistema web "de verdade", em escala didática.
