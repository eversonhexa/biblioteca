// ==========================================================
// Aula 10 — login de verdade
//
// Substitui a simulação da Aula 5 (que comparava usuário/senha
// direto no navegador, contra um array visível a qualquer
// pessoa). Agora a senha em texto puro só existe durante o
// próprio pedido HTTP (em trânsito) e nunca é guardada nem
// comparada diretamente — comparamos HASHES (veja utils/senha.js).
//
// Aula 11 — o login passou a criar uma SESSÃO de verdade
// (req.session.usuario), então "estar logado" agora dura entre
// páginas e recarregamentos — não só enquanto o formulário está
// na tela. Também ganhamos GET /sessao (para o frontend perguntar
// "quem está logado agora?") e POST /logout (para encerrar a
// sessão).
// ==========================================================

const express = require("express");
const pool = require("../db");
const { verificarSenha } = require("../utils/senha");

const router = express.Router();

// POST /api/login
// Corpo esperado: { "usuario": "bibliotecaria", "senha": "biblioteca123" }
router.post("/login", async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: "Informe usuário e senha." });
  }

  try {
    const [linhas] = await pool.query("SELECT * FROM usuarios WHERE usuario = ?", [usuario]);

    // De propósito, damos a MESMA mensagem de erro tanto para
    // "usuário não existe" quanto para "senha errada" — assim
    // como já fazíamos na simulação da Aula 5. Isso evita que
    // alguém tentando adivinhar credenciais descubra, por
    // eliminação, quais usuários existem no sistema.
    if (linhas.length === 0) {
      return res.status(401).json({ erro: "Usuário ou senha inválidos." });
    }

    const usuarioEncontrado = linhas[0];
    const senhaCorreta = await verificarSenha(senha, usuarioEncontrado.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Usuário ou senha inválidos." });
    }

    // Aqui está o ponto novo da Aula 11: em vez de só responder
    // "deu certo" e esquecer, guardamos quem logou dentro da
    // sessão. O express-session cuida de criar um cookie no
    // navegador (algo como "connect.sid") que identifica essa
    // sessão nos PRÓXIMOS pedidos — é assim que o servidor "lembra"
    // que esse navegador já provou quem é, sem precisar mandar
    // usuário/senha de novo a cada clique.
    //
    // Nunca guardamos "senha_hash" na sessão nem devolvemos isso
    // na resposta — o cliente não precisa (nem deve) receber isso.
    req.session.usuario = {
      id: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario,
      nome: usuarioEncontrado.nome,
    };

    res.json({
      mensagem: "Login realizado com sucesso.",
      nome: usuarioEncontrado.nome,
    });
  } catch (erro) {
    console.error("Falha ao processar login:", erro.message);
    res.status(500).json({ erro: "Não foi possível processar o login." });
  }
});

// GET /api/sessao
// O frontend chama esta rota ao carregar qualquer página para
// perguntar "existe alguém logado agora, neste navegador?".
// Não é uma rota "protegida" por exigirLogin — ela é justamente
// a forma de DESCOBRIR se está logado, então precisa responder
// para todo mundo (só que com respostas diferentes).
router.get("/sessao", (req, res) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ erro: "Nenhum usuário logado." });
  }
  res.json(req.session.usuario);
});

// POST /api/logout
router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.json({ mensagem: "Sessão encerrada." });
  }
  req.session.destroy((erro) => {
    if (erro) {
      console.error("Falha ao encerrar sessão:", erro.message);
      return res.status(500).json({ erro: "Não foi possível encerrar a sessão." });
    }
    // Limpa o cookie no navegador também — sem isso, o navegador
    // continuaria mandando um cookie que já não corresponde a
    // nenhuma sessão válida no servidor.
    res.clearCookie("connect.sid");
    res.json({ mensagem: "Sessão encerrada." });
  });
});

module.exports = router;
