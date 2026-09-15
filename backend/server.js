// ==========================================================
// Aula 6 — primeiro servidor com Node.js + Express
//
// "require" é a forma do Node.js (fora do navegador) de
// importar código de outros arquivos ou de bibliotecas
// instaladas via npm. É equivalente, em espírito, às tags
// <script> que usamos no frontend — mas o Node não tem HTML,
// então ele resolve isso com require/module.exports.
// ==========================================================

const express = require("express");
const listaDeLivros = require("./dados-livros");

const app = express();
const PORTA = 3000;

// ----------------------------------------------------------
// Rotas
//
// Uma "rota" é a combinação de um MÉTODO HTTP (GET, POST,
// PUT, DELETE...) com um CAMINHO (ex.: "/api/livros"). É
// assim que o servidor sabe o que fazer com cada pedido que
// chega. Por enquanto só usamos GET (buscar dados) — os
// outros métodos (para cadastrar, editar, excluir) vêm nas
// próximas aulas, quando conectarmos o banco de dados.
// ----------------------------------------------------------

// Rota "raiz": só para confirmar, no navegador, que o
// servidor está respondendo.
app.get("/", (req, res) => {
  res.send("Servidor da Biblioteca Escolar no ar! Veja /api/status e /api/livros.");
});

// Uma rota simples de "saúde" (health check), comum em APIs
// reais, usada para verificar rapidamente se o servidor está
// funcionando (ex.: por ferramentas de monitoramento).
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "Servidor da Biblioteca Escolar funcionando.",
    horario: new Date().toISOString(),
  });
});

// A rota que interessa de verdade: devolve a lista de livros
// em formato JSON. Note que é o MESMO formato de dados que já
// usávamos no frontend (frontend/js/dados-acervo.js) — só que
// agora entregue por um servidor, não mais "fixo" na página.
app.get("/api/livros", (req, res) => {
  res.json(listaDeLivros);
});

// ----------------------------------------------------------
// Inicializa o servidor, deixando-o "escutando" pedidos na
// porta 3000. Só depois desta chamada o servidor de fato
// começa a responder.
// ----------------------------------------------------------
app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
