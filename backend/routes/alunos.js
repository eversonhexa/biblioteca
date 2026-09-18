// ==========================================================
// Aula 10 — rotas de alunos, extraídas de server.js
//
// Aula 12 — ganhamos POST /, protegido por login, para cadastrar
// alunos de verdade (mesmo padrão já usado em livros, na Aula 11:
// validar de novo no servidor, exigir sessão, responder com o
// registro criado).
// ==========================================================

const express = require("express");
const pool = require("../db");
const exigirLogin = require("../middlewares/exigirLogin");

const router = express.Router();

// GET /api/alunos
router.get("/", async (req, res) => {
  try {
    const [linhas] = await pool.query("SELECT * FROM alunos ORDER BY nome");
    res.json(linhas);
  } catch (erro) {
    console.error("Falha ao buscar alunos:", erro.message);
    res.status(500).json({ erro: "Não foi possível buscar os alunos." });
  }
});

// POST /api/alunos
router.post("/", exigirLogin, async (req, res) => {
  const { nome, turma } = req.body;

  // Mesma ideia da Aula 11 em livros: validamos de novo aqui,
  // porque a validação do navegador (cadastro-aluno.js) é só uma
  // conveniência — quem realmente protege o banco é o servidor.
  const erros = [];

  if (typeof nome !== "string" || nome.trim().length < 2) {
    erros.push("Informe o nome do aluno (mínimo 2 letras).");
  }
  if (turma !== undefined && turma !== null && String(turma).trim().length > 30) {
    erros.push("A turma pode ter no máximo 30 caracteres.");
  }

  if (erros.length > 0) {
    return res.status(400).json({ erro: erros.join(" ") });
  }

  const turmaNormalizada = turma ? String(turma).trim() : null;

  try {
    const [resultado] = await pool.query("INSERT INTO alunos (nome, turma) VALUES (?, ?)", [
      nome.trim(),
      turmaNormalizada,
    ]);

    res.status(201).json({
      mensagem: "Aluno cadastrado com sucesso.",
      aluno: {
        id: resultado.insertId,
        nome: nome.trim(),
        turma: turmaNormalizada,
      },
    });
  } catch (erro) {
    console.error("Falha ao cadastrar aluno:", erro.message);
    res.status(500).json({ erro: "Não foi possível cadastrar o aluno." });
  }
});

module.exports = router;
