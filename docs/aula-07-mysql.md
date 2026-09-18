# Aula 7 — Banco de dados MySQL

## Objetivo

Instalar e modelar um banco de dados MySQL para o sistema, e conectar o servidor Node.js a ele — trocando o array fixo `dados-livros.js` por uma consulta de verdade à tabela `livros`.

Modelamos o banco **completo** nesta aula (livros, alunos e empréstimos, já relacionados entre si), mas o servidor só vai **consultar** a tabela de livros por enquanto. As tabelas de alunos e empréstimos entram em uso nas Aulas 8 e 9.

## Pré-requisitos

- Ter concluído a **Aula 6**.
- Ter o **MySQL Server** instalado no computador.

### Instalando o MySQL (se ainda não tiver)

1. Baixe o **MySQL Installer** em [dev.mysql.com/downloads/installer](https://dev.mysql.com/downloads/installer/).
2. No instalador, escolha a opção de instalação **"Developer Default"** (ou, no mínimo, marque **MySQL Server** e **MySQL Workbench** — o Workbench é a ferramenta visual que vamos usar para rodar nosso script e olhar as tabelas).
3. Durante a instalação, você vai definir uma **senha para o usuário `root`** (o usuário administrador do MySQL). **Anote essa senha** — vamos precisar dela daqui a pouco.
4. Ao final, o MySQL Server já fica rodando como um serviço do Windows (inicia sozinho com o computador).

> Se já usa XAMPP/WAMP (que também incluem MySQL/MariaDB), não tem problema — os passos seguintes funcionam do mesmo jeito, só muda como você acessa o servidor.

## 1. Por que trocar o array por um banco de dados?

Os arrays que usamos até aqui (`listaDeLivros`, `usuariosDeTeste`) resolvem bem para aprender lógica, mas têm um problema sério: **eles vivem só na memória do programa**. Se o servidor for reiniciado, tudo volta ao estado inicial escrito no código. Um banco de dados guarda os dados em **disco**, de forma organizada, e permite que muitas pessoas/programas leiam e alterem essas informações ao mesmo tempo, com segurança.

O **MySQL** é um SGBD (Sistema Gerenciador de Banco de Dados) **relacional**: os dados ficam organizados em **tabelas** (parecidas com uma planilha, com colunas fixas), e tabelas podem se **relacionar** entre si.

## 2. Arquivos novos desta aula

```
backend/
├── sql/
│   └── schema.sql          → cria o banco e as tabelas
├── db.js                    → conexão com o MySQL (pool)
├── .env.example              → modelo das variáveis de ambiente
└── server.js                 → (atualizado: /api/livros agora consulta o banco)
```

`dados-livros.js` continua no projeto, mas só como referência — não é mais usado pelo servidor.

## 3. A modelagem (`sql/schema.sql`)

Três tabelas:

- **`livros`**: igual ao que já tínhamos, agora como tabela. `id INT AUTO_INCREMENT PRIMARY KEY` cria um identificador único que o próprio MySQL gera sozinho a cada nova linha. `status ENUM('disponivel', 'emprestado')` é um tipo de coluna que só aceita esses dois valores exatos — o banco recusa qualquer outro, o que é uma validação a mais, agora no nível dos dados.
- **`alunos`**: uma tabela nova, que não existia no frontend como estrutura própria (lá, empréstimo tinha só um campo de texto "nome do aluno"). Criar uma tabela separada evita repetir/errar a digitação do nome de um aluno em vários empréstimos.
- **`emprestimos`**: a tabela que **relaciona** livros e alunos. As colunas `livro_id` e `aluno_id` são **chaves estrangeiras** (`FOREIGN KEY`): cada uma aponta para o `id` de uma linha existente em `livros`/`alunos`. Isso é o banco garantindo, por regra, que nunca vai existir um empréstimo apontando para um livro ou aluno que não existe — esse tipo de garantia é chamada de **integridade referencial**.

> **Conceito novo — relacionamento 1:N:** um livro pode aparecer em vários empréstimos ao longo do tempo (histórico), e um aluno também. Por isso `emprestimos` é uma tabela própria, e não colunas extras dentro de `livros` — é assim que se modela relacionamentos "um para muitos" em bancos relacionais.

### Rodando o script

**Opção A — MySQL Workbench (recomendada para começar):**
1. Abra o MySQL Workbench e conecte na sua instância local (usuário `root`, a senha que você definiu na instalação).
2. Vá em `File > Open SQL Script...` e escolha `backend/sql/schema.sql`.
3. Clique no ícone de raio (⚡) para executar o script inteiro.
4. No painel "Schemas" à esquerda, atualize (ícone de recarregar) — deve aparecer o schema `biblioteca_escolar` com as três tabelas.

**Opção B — linha de comando**, dentro da pasta `backend/`:
```
mysql -u root -p < sql/schema.sql
```
(ele vai pedir a senha do `root`).

## 4. Variáveis de ambiente e `.env`

Nunca escrevemos usuário/senha do banco direto no código-fonte — isso vazaria a senha para qualquer pessoa que veja o código (e, se o projeto for para o Git, para sempre no histórico). A solução padrão é um arquivo **`.env`**, que fica **fora do controle de versão** (já está no `.gitignore` desde a Aula 6).

1. Copie `backend/.env.example` para um novo arquivo `backend/.env`.
2. Edite o `.env` e coloque a senha real do seu MySQL em `DB_PASSWORD`.

O pacote **`dotenv`** é quem lê esse arquivo `.env` e disponibiliza cada linha em `process.env` (ex.: `process.env.DB_PASSWORD`), conforme visto em `db.js`.

## 5. A conexão (`db.js`) e o `mysql2`

```js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```

Usamos o pacote **`mysql2`**, na sua versão "promise" — ou seja, ela usa `async`/`await` em vez de *callbacks*, o que deixa o código mais parecido com o que já escrevemos até aqui.

Criamos um **pool de conexões**, em vez de uma conexão única: o pool mantém várias conexões abertas e as reaproveita entre pedidos diferentes, o que é bem mais eficiente do que abrir/fechar uma conexão nova a cada requisição que chega no servidor.

## 6. `async`/`await` e tratamento de erros no `server.js`

```js
app.get("/api/livros", async (req, res) => {
  try {
    const [linhas] = await pool.query("SELECT * FROM livros ORDER BY titulo");
    res.json(linhas);
  } catch (erro) {
    console.error("Falha ao buscar livros:", erro.message);
    res.status(500).json({ erro: "Não foi possível buscar os livros." });
  }
});
```

- **`async` na função da rota**: consultar um banco de dados leva um tempo (ele pode estar em outra máquina, ou só ser mais lento que ler um array em memória). `async`/`await` deixa o código esperar o resultado sem travar o servidor inteiro enquanto isso.
- **`const [linhas] = await pool.query(...)`**: o `mysql2/promise` devolve um array onde a primeira posição são as linhas encontradas — por isso o `[linhas]` (uma técnica chamada *destructuring*, "desestruturação").
- **`try/catch`**: se o banco estiver fora do ar, ou a senha estiver errada, ou a tabela não existir — qualquer erro cai no `catch`, registramos no console (para nós, desenvolvedores, depurarmos) e respondemos ao cliente com um erro **HTTP 500** ("Erro Interno do Servidor") e uma mensagem genérica — nunca expondo detalhes técnicos do banco para quem fez o pedido (isso também é uma prática de segurança).

## 7. Instalando as dependências e testando

1. Dentro de `backend/`, rode:
   ```
   npm install
   ```
   (isso vai instalar também o `mysql2` e o `dotenv`, que adicionamos ao `package.json`).
2. Confirme que criou o arquivo `.env` (passo 4 acima).
3. Rode `npm run dev`.
4. Acesse `http://localhost:3000/api/status` — deve aparecer `"banco": "conectado"`. Se aparecer erro, confira a senha no `.env` e se o serviço do MySQL está rodando.
5. Acesse `http://localhost:3000/api/livros` — a lista deve ser idêntica à que já conhecíamos, só que agora vem do banco.
6. **Teste de verdade:** abra o MySQL Workbench, edite diretamente uma linha da tabela `livros` (ex.: mude um `titulo`), clique em "Apply" para salvar, e recarregue `http://localhost:3000/api/livros` no navegador. A mudança deve aparecer — prova de que os dados realmente vêm do banco agora, não mais de um array fixo no código.

## 8. Desafios para praticar

1. Criar uma rota `GET /api/alunos` que devolve todos os alunos da tabela `alunos`.
2. No MySQL Workbench, inserir mais um aluno manualmente e confirmar que ele aparece ao testar a rota do desafio anterior.
3. Pesquisar o que faz o comando `SELECT * FROM emprestimos JOIN livros ON emprestimos.livro_id = livros.id` — não precisa usar ainda, só entender a ideia de **JOIN** (juntar dados de tabelas relacionadas em uma única consulta). Vamos usar isso de verdade na Aula 9.

## Próxima aula

**Aula 8 — Integração frontend + backend**: o frontend vai finalmente parar de usar o array `dados-acervo.js` e passar a buscar os livros direto do nosso servidor, usando `fetch`. Vamos conhecer o conceito de **CORS** (a política de segurança do navegador que controla quem pode chamar nossa API) e ajustar o Express para permitir isso.
