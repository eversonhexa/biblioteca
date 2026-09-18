// ==========================================================
// Aula 10 — função de data movida para cá, para ser reaproveitada
// por mais de um arquivo de rotas (antes vivia só dentro de
// server.js).
// ==========================================================

function obterDataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

module.exports = { obterDataHojeISO };
