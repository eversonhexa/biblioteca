// ==========================================================
// Aula 6 — dados de exemplo do acervo, agora no BACKEND
//
// Este é o mesmo conteúdo que existia em
// frontend/js/dados-acervo.js. A diferença importante não é
// o conteúdo, é o LUGAR onde ele mora agora: antes vivia no
// navegador de quem abria a página; agora vive no servidor,
// e será o servidor quem entrega esses dados para quem pedir.
//
// Continua sendo um array fixo por enquanto — na Aula 7,
// quando conectarmos o MySQL, essa lista vai sair daqui e
// passar a vir de verdade do banco de dados.
//
// "module.exports" é a forma do Node.js de dizer: "este
// arquivo pode ser usado (importado) por outros arquivos".
// Sem essa linha, o array ficaria "preso" só dentro deste
// arquivo.
// ==========================================================

const listaDeLivros = [
  { id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis", categoria: "Romance", ano: 1899, status: "disponivel" },
  { id: 2, titulo: "O Cortiço", autor: "Aluísio Azevedo", categoria: "Romance", ano: 1890, status: "emprestado" },
  { id: 3, titulo: "Vidas Secas", autor: "Graciliano Ramos", categoria: "Romance", ano: 1938, status: "disponivel" },
  { id: 4, titulo: "Capitães da Areia", autor: "Jorge Amado", categoria: "Romance", ano: 1937, status: "disponivel" },
  { id: 5, titulo: "Iracema", autor: "José de Alencar", categoria: "Romance", ano: 1865, status: "emprestado" },
  { id: 6, titulo: "Memórias Póstumas de Brás Cubas", autor: "Machado de Assis", categoria: "Romance", ano: 1881, status: "disponivel" },
  { id: 7, titulo: "O Alienista", autor: "Machado de Assis", categoria: "Conto", ano: 1882, status: "disponivel" },
  { id: 8, titulo: "Grande Sertão: Veredas", autor: "Guimarães Rosa", categoria: "Romance", ano: 1956, status: "disponivel" },
  { id: 9, titulo: "Auto da Compadecida", autor: "Ariano Suassuna", categoria: "Teatro", ano: 1955, status: "emprestado" },
  { id: 10, titulo: "Quincas Borba", autor: "Machado de Assis", categoria: "Romance", ano: 1891, status: "disponivel" },
];

module.exports = listaDeLivros;
