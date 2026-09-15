# Aula 6 — Início do backend com Node.js

## Objetivo

Sair do frontend pela primeira vez e criar nosso primeiro **servidor**: um programa Node.js que fica "escutando" pedidos e responde com dados em formato JSON. Vamos entender o que é uma API, o que são rotas HTTP, e recriar a rota que devolve a lista de livros — só que agora vinda de um servidor, não mais fixa na página.

O frontend **ainda não vai consumir** esse servidor nesta aula — isso é o assunto da Aula 8. Por enquanto, testamos o servidor sozinho, direto no navegador.

## Pré-requisitos

- Ter concluído as **Aulas 1 a 5** (o frontend completo).
- Ter o **Node.js** instalado no computador. Para verificar, abra um terminal (PowerShell ou Prompt de Comando) e digite:
  ```
  node -v
  npm -v
  ```
  Se aparecer um número de versão para os dois, está tudo certo. Se der erro de "comando não encontrado", baixe e instale a versão **LTS** em [nodejs.org](https://nodejs.org) (o instalador já inclui o `npm` junto).

## 1. O que é Node.js, e por que ele muda o jogo

Até agora, todo o JavaScript que escrevemos rodava **dentro do navegador** de quem visitava a página. O Node.js é um jeito de rodar esse mesmo JavaScript **fora do navegador**, direto no computador (ou em um servidor na internet) — sem precisar abrir página nenhuma.

Isso é o que nos permite criar um programa que fica no ar, esperando pedidos de qualquer navegador (ou celular, ou outro programa) e respondendo com dados. Esse programa é o que chamamos de **servidor** ou, no nosso caso específico, uma **API** (Application Programming Interface — uma "porta de entrada" para outros programas conversarem com o nosso sistema).

## 2. Arquivos novos desta aula

```
backend/
├── package.json         → "ficha de identidade" do projeto Node
├── .gitignore
├── server.js             → o servidor em si (rotas)
└── dados-livros.js       → a mesma lista de livros, agora no servidor
```

O `README.md` também foi atualizado, com a estrutura de pastas e o roteiro marcando a Aula 6.

## 3. `package.json` e o `npm`

O **npm** (Node Package Manager) é o gerenciador de pacotes do Node — o mesmo tipo de ferramenta que existe em outras linguagens (pense nele como uma "loja de bibliotecas prontas"). O `package.json` é o arquivo que descreve o projeto Node e quais pacotes (dependências) ele usa:

```json
{
  "name": "biblioteca-escolar-backend",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

- **`dependencies`**: pacotes que o programa precisa para **funcionar** (o `express`, que vamos explicar já já).
- **`devDependencies`**: pacotes úteis só durante o **desenvolvimento**, não em produção (o `nodemon`, que reinicia o servidor sozinho a cada alteração salva — sem ele, teríamos que parar e ligar o servidor manualmente toda vez que mudássemos o código).
- **`scripts`**: atalhos de comando. `npm run dev` executa `nodemon server.js`.

> **Por que não mandei a pasta `node_modules`?** Porque ela é gerada automaticamente pelo `npm install`, a partir do `package.json`, e pode ter milhares de arquivos — é uma convenção universal **nunca** versionar nem compartilhar essa pasta (por isso ela já está no `.gitignore`). Cada pessoa que for rodar o projeto gera a sua própria.

## 4. Instalando as dependências

Dentro da pasta `backend/`, rode:

```
npm install
```

Esse comando lê o `package.json`, baixa o `express` e o `nodemon` da internet e cria a pasta `node_modules/` (e um arquivo `package-lock.json`, que trava as versões exatas instaladas — pode deixá-lo, ele deve ser versionado, diferente do `node_modules`).

## 5. O que é o Express

**Express** é um *framework* (um conjunto de ferramentas prontas) para criar servidores web com Node.js. Daria para criar um servidor só com o Node "puro", mas seria bem mais trabalhoso — o Express já resolve várias coisas repetitivas (interpretar a URL pedida, montar a resposta, etc.) com uma sintaxe simples.

## 6. Lendo o `server.js`

```js
const express = require("express");
const listaDeLivros = require("./dados-livros");

const app = express();
const PORTA = 3000;

app.get("/api/livros", (req, res) => {
  res.json(listaDeLivros);
});

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
```

- **`require("express")`**: importa a biblioteca instalada via npm. É equivalente, em espírito, ao `<script src="...">` do frontend — mas no Node não existe HTML, então essa é a forma de "importar" código.
- **`require("./dados-livros")`**: importa nosso próprio arquivo (repare no `./`, que indica "um arquivo aqui do projeto", não um pacote instalado).
- **`app.get(caminho, funcao)`**: define uma **rota**. Sempre que chegar um pedido `GET` para aquele caminho, a função é executada.
- **`req` e `res`**: abreviações de *request* (o pedido que chegou) e *response* (a resposta que vamos montar e devolver). Praticamente toda rota do Express recebe esses dois parâmetros.
- **`res.json(...)`**: converte o array/objeto JavaScript em texto no formato JSON e o envia como resposta, já com o cabeçalho HTTP correto (`Content-Type: application/json`) — é o formato padrão para uma API conversar com outros programas.
- **`app.listen(PORTA, ...)`**: liga o servidor, que fica "escutando" na porta 3000 do computador até ser desligado.

> **O que é uma "porta"?** Pense no computador como um prédio com vários apartamentos numerados — a "porta" (nº 3000, no nosso caso) é o número do apartamento onde o nosso servidor mora. Isso permite ter vários programas escutando pedidos ao mesmo tempo na mesma máquina, cada um em sua porta.

## 7. Rodando e testando o servidor

1. No terminal, dentro de `backend/`, rode:
   ```
   npm run dev
   ```
2. Deve aparecer no terminal: `Servidor rodando em http://localhost:3000`.
3. Abra o navegador e acesse:
   - `http://localhost:3000/` → mensagem de boas-vindas simples.
   - `http://localhost:3000/api/status` → um JSON com `status: "ok"` e o horário atual.
   - `http://localhost:3000/api/livros` → a lista completa de livros, em JSON.
4. Deixe o servidor rodando, abra `server.js` e mude o texto da rota `/` (ex.: adicione uma exclamação a mais). Salve o arquivo e observe o terminal: o **nodemon** reinicia o servidor sozinho. Atualize a página no navegador para ver a mudança — sem precisar parar/religar nada manualmente.
5. Para desligar o servidor, volte ao terminal e pressione `Ctrl + C`.

## 8. Por que a lista de livros "mudou de casa"

Repare que `backend/dados-livros.js` tem exatamente o mesmo conteúdo de `frontend/js/dados-acervo.js`. Isso é proposital, e temporário: na Aula 7 vamos trocar esse array fixo por dados de verdade vindos do **MySQL**, e na Aula 8 vamos fazer o frontend **parar de usar seu próprio array** e passar a buscar os livros aqui do servidor (com `fetch`). A ideia desta aula é só separar bem os dois mundos antes de conectá-los.

## 9. Desafios para praticar

1. Criar uma rota nova, `GET /api/livros/disponiveis`, que devolve só os livros com `status: "disponivel"` (dica: use `.filter()`, igual fizemos no frontend).
2. Criar uma rota `GET /api/livros/:id` que devolve um único livro pelo id (pesquise sobre "route parameters" no Express — é o `:id` na URL).
3. Mudar a porta do servidor de 3000 para 4000 e testar de novo no navegador.

## Próxima aula

**Aula 7 — Banco de dados MySQL**: vamos instalar o MySQL, modelar as tabelas do nosso sistema (livros, alunos, empréstimos) e conectar o servidor Node.js a esse banco, trocando o array fixo `dados-livros.js` por consultas de verdade.
