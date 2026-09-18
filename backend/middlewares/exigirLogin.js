// ==========================================================
// Aula 11 — middleware de autenticação
//
// Um "middleware" no Express é só uma função que roda ANTES da
// rota final, e decide se o pedido pode continuar (chamando
// next()) ou se deve ser interrompido ali mesmo (respondendo
// direto, sem chamar next()).
//
// Este middleware protege rotas que só podem ser usadas por
// quem já fez login: ele confere se existe uma sessão válida
// (criada em POST /api/login, veja routes/auth.js) e, se não
// existir, responde 401 e a rota "de verdade" nunca chega a
// ser executada.
//
// Importante: isso vale mesmo que o pedido não venha do nosso
// próprio frontend — alguém chamando a API direto (Postman,
// curl, um outro site) sem estar logado recebe o mesmo 401.
// A proteção fica no SERVIDOR, não só escondendo botões na tela.
// ==========================================================

function exigirLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ erro: "Você precisa estar logado para fazer isso." });
  }
  next();
}

module.exports = exigirLogin;
