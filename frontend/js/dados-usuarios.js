// ==========================================================
// [ARQUIVO HISTÓRICO — desde a Aula 10, login.html/login.js
// não usam mais este array. O login agora é conferido de
// verdade no servidor (POST /api/login), contra senhas com
// hash guardadas no banco (veja backend/utils/senha.js e
// backend/scripts/criar-usuarios.js). Fica aqui só como
// registro de como o projeto começou — e do que NÃO fazer.]
//
// Aula 5 — usuários de teste para o login simulado
//
// ATENÇÃO — ISTO NÃO É SEGURO E NUNCA DEVE SER FEITO EM UM
// SISTEMA DE VERDADE:
//
// Qualquer pessoa pode abrir o DevTools do navegador (F12),
// ver este arquivo e ler todas as senhas em texto puro. Em um
// sistema real, o navegador NUNCA guarda a lista de senhas —
// ele envia usuário e senha para o servidor, e é o SERVIDOR
// (que vamos construir com Node.js) quem confere as
// credenciais, comparando com uma senha criptografada (hash)
// guardada no banco de dados. O navegador nunca vê a senha
// certa, só descobre se a que ele enviou bateu ou não.
//
// Usamos essa lista aqui só para PRATICAR a lógica de um
// formulário de login (campos, validação, feedback), sem
// ainda ter um backend.
// ==========================================================

const usuariosDeTeste = [
  { usuario: "bibliotecaria", senha: "biblioteca123", nome: "Ana (Bibliotecária)" },
  { usuario: "aluno1", senha: "aluno123", nome: "Carlos (Aluno)" },
];
