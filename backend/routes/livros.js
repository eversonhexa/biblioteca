// ==========================================================
// Aula 10 — rotas de livros, extraídas de server.js
//
// express.Router() cria um "mini app" do Express, que só
// cuida das rotas de um assunto (aqui, livros). Em vez de
// escrever "/api/livros" toda vez, escrevemos só "/" — quem
// decide o prefixo "/api/livros" é o server.js, na hora de
// "montar" este router (app.use("/api/livros", router)).
//
// Aula 11 — ganhamos POST /, que finalmente grava de verdade
// no banco (até aqui, a tela "Cadastrar Livro" só guardava os
// dados na memória do navegador — veja js/cadastro.js). Assim
// como em empréstimos, cadastrar exige login; consultar não.
//
// Ajuste (depois da Aula 11) — campo ISBN: opcional, mas quando
// informado precisa ter exatamente 13 dígitos e ser único (dois
// livros não podem compartilhar o mesmo ISBN).
//
// Ajuste (cadastro de livros) — campo editora: opcional, sem
// formato especial (é só texto livre, como "Companhia das Letras").
// ==========================================================

const express = require("express");
const pool = require("../db");
const exigirLogin = require("../middlewares/exigirLogin");

const router = express.Router();

const CATEGORIAS_VALIDAS = ["Romance", "Conto", "Poesia", "Teatro", "Didático", "Outro"];

// Aceita o ISBN digitado com ou sem hífens/espaços (ex.:
// "978-85-359-0277-5" ou "9788535902775") e devolve só os
// dígitos, que é o formato que guardamos no banco.
function normalizarIsbn(valorBruto) {
  return String(valorBruto || "").replace(/[^0-9]/g, "");
}

// GET /api/livros
// Evolução 1 — a consulta ao acervo passou a exigir login (antes,
// qualquer pessoa podia ver a lista de livros sem estar autenticada).
//
// A consulta também ganhou um LEFT JOIN com emprestimos/alunos: além
// dos dados do livro, cada linha já vem com quem pegou emprestado e
// até quando (quando o livro estiver emprestado), para a tela única
// de Consulta e Empréstimos não precisar de uma segunda chamada à
// API só para descobrir isso.
router.get("/", exigirLogin, async (req, res) => {
  try {
    const [linhas] = await pool.query(
      `SELECT
         livros.*,
         emprestimos.id AS emprestimoId,
         alunos.nome AS alunoNome,
         emprestimos.data_prevista AS dataPrevista
       FROM livros
       LEFT JOIN emprestimos
         ON emprestimos.livro_id = livros.id
         AND emprestimos.data_devolucao IS NULL
       LEFT JOIN alunos ON alunos.id = emprestimos.aluno_id
       ORDER BY livros.titulo`
    );
    res.json(linhas);
  } catch (erro) {
    console.error("Falha ao buscar livros:", erro.message);
    res.status(500).json({ erro: "Não foi possível buscar os livros." });
  }
});

// POST /api/livros
router.post("/", exigirLogin, async (req, res) => {
  const { titulo, autor, categoria, ano, isbn, editora } = req.body;
  const anoAtual = new Date().getFullYear();

  // Assim como no formulário (js/cadastro.js), validamos os
  // dados aqui de novo — a validação do navegador é só uma
  // conveniência para quem usa a tela; a validação que REALMENTE
  // protege o sistema é sempre a do servidor, porque qualquer
  // pessoa pode pular a tela e chamar a API direto.
  const erros = [];

  if (typeof titulo !== "string" || titulo.trim().length < 2) {
    erros.push("Informe o título do livro (mínimo 2 letras).");
  }
  if (typeof autor !== "string" || autor.trim().length < 2) {
    erros.push("Informe o nome do autor (mínimo 2 letras).");
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    erros.push("Selecione uma categoria válida.");
  }
  const anoNumero = Number(ano);
  if (!Number.isInteger(anoNumero) || anoNumero < 1000 || anoNumero > anoAtual) {
    erros.push(`Informe um ano entre 1000 e ${anoAtual}.`);
  }

  // ISBN é opcional — livros anteriores a ~1970 nunca tiveram um.
  // Mas, se a pessoa informou algo, precisa ser um ISBN válido:
  // exatamente 13 dígitos, depois de tirar hífens/espaços.
  const isbnNormalizado = normalizarIsbn(isbn);
  if (isbnNormalizado !== "" && isbnNormalizado.length !== 13) {
    erros.push("O ISBN, se informado, deve ter 13 dígitos.");
  }

  // Editora é opcional, assim como o ISBN — alguns livros do acervo
  // (principalmente os mais antigos) não têm essa informação à mão.
  const editoraNormalizada = typeof editora === "string" ? editora.trim() : "";

  if (erros.length > 0) {
    return res.status(400).json({ erro: erros.join(" ") });
  }

  try {
    const [resultado] = await pool.query(
      "INSERT INTO livros (titulo, autor, categoria, ano, isbn, editora, status) VALUES (?, ?, ?, ?, ?, ?, 'disponivel')",
      [titulo.trim(), autor.trim(), categoria, anoNumero, isbnNormalizado || null, editoraNormalizada || null]
    );

    res.status(201).json({
      mensagem: "Livro cadastrado com sucesso.",
      livro: {
        id: resultado.insertId,
        titulo: titulo.trim(),
        autor: autor.trim(),
        categoria,
        ano: anoNumero,
        isbn: isbnNormalizado || null,
        editora: editoraNormalizada || null,
        status: "disponivel",
      },
    });
  } catch (erro) {
    // ER_DUP_ENTRY acontece quando o ISBN enviado já existe em
    // outro livro — a restrição UNIQUE da coluna "isbn" (definida
    // em sql/schema.sql) é quem garante isso, mesmo que, por
    // algum motivo, essa checagem não fosse feita aqui em cima.
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ erro: "Já existe um livro cadastrado com esse ISBN." });
    }
    console.error("Falha ao cadastrar livro:", erro.message);
    res.status(500).json({ erro: "Não foi possível cadastrar o livro." });
  }
});

module.exports = router;
