// ==========================================================
// Aula 7 — conexão com o MySQL
//
// Centralizamos a conexão aqui, em um arquivo próprio, para
// que qualquer rota do server.js possa importar e usar o
// mesmo "pool" de conexões, em vez de cada rota abrir a sua.
// ==========================================================

// "dotenv" lê o arquivo .env e coloca cada linha dele em
// "process.env" (um objeto global do Node com variáveis de
// ambiente). Precisa ser chamado o quanto antes no programa.
require("dotenv").config();

const mysql = require("mysql2/promise");

// Um "pool" mantém várias conexões abertas com o banco,
// reaproveitando-as entre as requisições — mais eficiente do
// que abrir e fechar uma conexão nova a cada consulta.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Sem isso, colunas DATE/DATETIME (que passamos a usar na
  // Aula 9, na tabela "emprestimos") viriam como objetos Date
  // do JavaScript. Com "dateStrings: true", elas chegam como
  // texto simples ("2026-09-18"), no mesmo formato que já
  // usamos em todo o frontend (inputs type="date", etc.) — bem
  // mais simples de trabalhar e de enviar como JSON.
  dateStrings: true,
});

module.exports = pool;
