// ==========================================================
// Aula 10 — hash de senhas, com o módulo "crypto" que já vem
// embutido no Node.js (não precisa instalar nada via npm).
//
// NUNCA guardamos a senha do usuário em texto puro (lembra do
// aviso da Aula 5, sobre dados-usuarios.js?). Em vez disso,
// guardamos o resultado de uma função de hash: um processo
// que transforma a senha em um texto de tamanho fixo, e que
// NÃO tem volta — não existe "deshash" para descobrir a senha
// original a partir do hash.
//
// Usamos aqui o algoritmo "scrypt", pensado especificamente
// para senhas: ele é de propósito LENTO e consome bastante
// memória, o que dificulta um ataque de força bruta (tentar
// milhões de senhas por segundo) — bem diferente de um hash
// "rápido" como o usado para checar a integridade de um
// arquivo, por exemplo.
// ==========================================================

const crypto = require("crypto");

const TAMANHO_HASH = 64;

// Gera um hash novo para uma senha em texto puro. Cada chamada
// usa um "salt" (tempero) aleatório diferente — isso garante
// que duas pessoas com a MESMA senha tenham hashes DIFERENTES
// guardados no banco, o que impede o uso de tabelas prontas de
// hashes conhecidos (rainbow tables) para "adivinhar" senhas
// em massa.
function gerarHash(senha) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");

    crypto.scrypt(senha, salt, TAMANHO_HASH, (erro, chaveDerivada) => {
      if (erro) return reject(erro);
      // Guardamos o salt junto do hash (separados por ":"),
      // porque vamos precisar dele de novo para conferir a
      // senha no login.
      resolve(`${salt}:${chaveDerivada.toString("hex")}`);
    });
  });
}

// Confere se uma senha em texto puro corresponde a um hash já
// guardado no banco. Repare que NÃO comparamos a senha em si —
// recalculamos o hash da senha recebida (usando o MESMO salt
// gravado) e comparamos os dois hashes.
function verificarSenha(senha, hashArmazenado) {
  return new Promise((resolve, reject) => {
    const [salt, hashOriginalHex] = hashArmazenado.split(":");

    crypto.scrypt(senha, salt, TAMANHO_HASH, (erro, chaveDerivada) => {
      if (erro) return reject(erro);

      const hashOriginal = Buffer.from(hashOriginalHex, "hex");

      // crypto.timingSafeEqual, em vez de "===", compara os
      // bytes em um tempo constante, independente de onde os
      // hashes começam a diferir. Isso evita um "timing attack"
      // (alguém medindo, com precisão, quantos microssegundos a
      // comparação levou, para deduzir aos poucos quantos
      // caracteres já acertou).
      const mesmoTamanho = hashOriginal.length === chaveDerivada.length;
      const iguais = mesmoTamanho && crypto.timingSafeEqual(hashOriginal, chaveDerivada);
      resolve(iguais);
    });
  });
}

module.exports = { gerarHash, verificarSenha };
