// ==========================================================
// Aula 1 — primeiro contato com JavaScript no projeto
//
// Por enquanto o script faz só uma coisa simples: escreve o
// ano atual no rodapé automaticamente, para não precisarmos
// editar o HTML todo ano.
// ==========================================================

// 1. Pegamos o elemento do HTML pelo id "ano-atual"
const elementoAno = document.getElementById("ano-atual");

// 2. Pedimos ao navegador a data de hoje
const dataDeHoje = new Date();

// 3. Extraímos só o ano e colocamos dentro do elemento
elementoAno.textContent = dataDeHoje.getFullYear();

// Dica: abra o Console do navegador (F12 → aba "Console")
// e digite "dataDeHoje" para ver o objeto de data completo.
