// ==========================================================
// Aula 10 — script para criar (ou resetar a senha) dos usuários
// de teste no banco de dados.
//
// Por que um script, e não um INSERT direto no schema.sql?
// Porque o hash da senha só pode ser calculado rodando o
// código de hash (utils/senha.js) — não dá para "escrever à
// mão" um hash de scrypt válido em SQL puro.
//
// Como rodar (dentro da pasta backend/, com o .env já
// configurado):
//   node scripts/criar-usuarios.js
//
// Pode rodar quantas vezes quiser: se o usuário já existir, o
// script só atualiza a senha (útil se você esquecer a senha de
// teste e quiser "resetar").
// ==========================================================

const pool = require("../db");
const { gerarHash } = require("../utils/senha");

const USUARIOS_DE_TESTE = [
  { usuario: "bibliotecaria", senha: "biblioteca123", nome: "Ana (Bibliotecária)" },
  { usuario: "aluno1", senha: "aluno123", nome: "Carlos (Aluno)" },
];

async function criarUsuarios() {
  for (const dados of USUARIOS_DE_TESTE) {
    const hash = await gerarHash(dados.senha);

    // "ON DUPLICATE KEY UPDATE" faz o MySQL tentar o INSERT e,
    // se já existir uma linha com o mesmo "usuario" (que é
    // UNIQUE), atualizar a senha e o nome em vez de dar erro de
    // duplicidade. Isso é o que torna o script seguro de rodar
    // mais de uma vez.
    await pool.query(
      `INSERT INTO usuarios (usuario, senha_hash, nome)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash), nome = VALUES(nome)`,
      [dados.usuario, hash, dados.nome]
    );

    console.log(`Usuário "${dados.usuario}" criado/atualizado com sucesso.`);
  }

  // Scripts avulsos (fora do server.js) precisam encerrar o
  // pool manualmente — senão o processo Node fica "pendurado",
  // esperando por conexões que nunca mais serão usadas.
  await pool.end();
}

criarUsuarios().catch((erro) => {
  console.error("Falha ao criar usuários:", erro.message);
  process.exit(1);
});
