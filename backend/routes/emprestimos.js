// ==========================================================
// Aula 10 — rotas de empréstimos, extraídas de server.js
// (lógica idêntica à da Aula 9, só que agora em arquivo próprio)
// Aula 11 — registrar empréstimo e registrar devolução passaram
//           a exigir login (exigirLogin) — consultar continua
//           liberado para qualquer um, só alterar dados exige
//           estar autenticado.
// ==========================================================

const express = require("express");
const pool = require("../db");
const { obterDataHojeISO } = require("../utils/data");
const exigirLogin = require("../middlewares/exigirLogin");

const router = express.Router();

// GET /api/emprestimos            → ativos (ordenados por data
//                                    prevista ASC — ou seja, os
//                                    mais atrasados/mais próximos
//                                    do vencimento aparecem primeiro;
//                                    é essa ordenação que a tela
//                                    "Livros em atraso" reaproveita)
// GET /api/emprestimos?status=historico → devolvidos
//
// Evolução 1 — passou a exigir login, já que só é usada dentro de
// telas que agora exigem sessão válida (Consulta e Empréstimos,
// Livros em atraso).
router.get("/", exigirLogin, async (req, res) => {
  const querSomenteHistorico = req.query.status === "historico";

  const condicao = querSomenteHistorico
    ? "emprestimos.data_devolucao IS NOT NULL"
    : "emprestimos.data_devolucao IS NULL";

  const ordenacao = querSomenteHistorico
    ? "ORDER BY emprestimos.data_devolucao DESC"
    : "ORDER BY emprestimos.data_prevista ASC";

  try {
    const [linhas] = await pool.query(
      `SELECT
         emprestimos.id,
         emprestimos.livro_id AS livroId,
         emprestimos.aluno_id AS alunoId,
         livros.titulo AS livroTitulo,
         livros.isbn AS livroIsbn,
         alunos.nome AS alunoNome,
         alunos.turma AS alunoTurma,
         emprestimos.data_emprestimo AS dataEmprestimo,
         emprestimos.data_prevista AS dataPrevista,
         emprestimos.data_devolucao AS dataDevolucao
       FROM emprestimos
       JOIN livros ON livros.id = emprestimos.livro_id
       JOIN alunos ON alunos.id = emprestimos.aluno_id
       WHERE ${condicao}
       ${ordenacao}`
    );
    res.json(linhas);
  } catch (erro) {
    console.error("Falha ao buscar empréstimos:", erro.message);
    res.status(500).json({ erro: "Não foi possível buscar os empréstimos." });
  }
});

// POST /api/emprestimos
// exigirLogin roda ANTES do handler abaixo: se não houver sessão
// válida, a resposta 401 já sai dali, e este código nem executa.
router.post("/", exigirLogin, async (req, res) => {
  const { livroId, alunoId, dataPrevista } = req.body;
  const hojeISO = obterDataHojeISO();

  if (!livroId || !alunoId || !dataPrevista) {
    return res.status(400).json({ erro: "Informe livroId, alunoId e dataPrevista." });
  }
  if (dataPrevista < hojeISO) {
    return res.status(400).json({ erro: "A data prevista de devolução não pode ser no passado." });
  }

  const conexao = await pool.getConnection();

  try {
    await conexao.beginTransaction();

    const [livros] = await conexao.query("SELECT status FROM livros WHERE id = ? FOR UPDATE", [livroId]);

    if (livros.length === 0) {
      await conexao.rollback();
      return res.status(404).json({ erro: "Livro não encontrado." });
    }
    if (livros[0].status !== "disponivel") {
      await conexao.rollback();
      return res.status(409).json({ erro: "Este livro não está disponível para empréstimo." });
    }

    await conexao.query(
      "INSERT INTO emprestimos (livro_id, aluno_id, data_emprestimo, data_prevista) VALUES (?, ?, ?, ?)",
      [livroId, alunoId, hojeISO, dataPrevista]
    );
    await conexao.query("UPDATE livros SET status = 'emprestado' WHERE id = ?", [livroId]);

    await conexao.commit();
    res.status(201).json({ mensagem: "Empréstimo registrado com sucesso." });
  } catch (erro) {
    await conexao.rollback();
    console.error("Falha ao registrar empréstimo:", erro.message);

    if (erro.code === "ER_NO_REFERENCED_ROW_2" || erro.code === "ER_NO_REFERENCED_ROW") {
      return res.status(400).json({ erro: "Aluno ou livro inválido." });
    }
    res.status(500).json({ erro: "Não foi possível registrar o empréstimo." });
  } finally {
    conexao.release();
  }
});

// PUT /api/emprestimos/:id/devolucao
router.put("/:id/devolucao", exigirLogin, async (req, res) => {
  const { id } = req.params;
  const hojeISO = obterDataHojeISO();

  const conexao = await pool.getConnection();

  try {
    await conexao.beginTransaction();

    const [emprestimos] = await conexao.query(
      "SELECT livro_id, data_devolucao FROM emprestimos WHERE id = ? FOR UPDATE",
      [id]
    );

    if (emprestimos.length === 0) {
      await conexao.rollback();
      return res.status(404).json({ erro: "Empréstimo não encontrado." });
    }
    if (emprestimos[0].data_devolucao !== null) {
      await conexao.rollback();
      return res.status(409).json({ erro: "Este empréstimo já foi devolvido." });
    }

    await conexao.query("UPDATE emprestimos SET data_devolucao = ? WHERE id = ?", [hojeISO, id]);
    await conexao.query("UPDATE livros SET status = 'disponivel' WHERE id = ?", [emprestimos[0].livro_id]);

    await conexao.commit();
    res.json({ mensagem: "Devolução registrada com sucesso." });
  } catch (erro) {
    await conexao.rollback();
    console.error("Falha ao registrar devolução:", erro.message);
    res.status(500).json({ erro: "Não foi possível registrar a devolução." });
  } finally {
    conexao.release();
  }
});

module.exports = router;
