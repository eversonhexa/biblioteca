// ==========================================================
// Aula 2 — tela de listagem do acervo
//
// Este arquivo pega os dados de "dados-acervo.js" (o array
// listaDeLivros) e desenha (renderiza) uma linha de tabela
// para cada livro. Também cuida do campo de busca.
// ==========================================================

// Elementos do HTML que vamos manipular
const corpoDaTabela = document.getElementById("tabela-acervo-corpo");
const campoDeBusca = document.getElementById("campo-busca");
const mensagemVazio = document.getElementById("mensagem-vazio");

// Traduz o "status" salvo nos dados (disponivel/emprestado)
// para um texto e uma classe CSS de cor.
function formatarStatus(status) {
  if (status === "disponivel") {
    return { texto: "Disponível", classe: "badge--disponivel" };
  }
  return { texto: "Emprestado", classe: "badge--emprestado" };
}

// Recebe um array de livros e desenha a tabela inteira.
// Sempre que a busca mudar, chamamos essa função de novo
// com a lista já filtrada.
function renderizarLivros(livros) {
  // Começamos limpando o conteúdo atual da tabela...
  corpoDaTabela.innerHTML = "";

  // ...e mostramos (ou escondemos) a mensagem de "nada encontrado".
  mensagemVazio.hidden = livros.length > 0;

  livros.forEach((livro) => {
    const status = formatarStatus(livro.status);

    // Criamos a linha <tr> usando um "template string" (crase),
    // que permite misturar HTML com variáveis JavaScript usando ${}.
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.categoria}</td>
      <td>${livro.ano}</td>
      <td><span class="badge ${status.classe}">${status.texto}</span></td>
    `;

    corpoDaTabela.appendChild(linha);
  });
}

// Filtra a lista de livros pelo texto digitado no campo de busca,
// procurando tanto no título quanto no autor.
function filtrarLivros(termo) {
  const termoNormalizado = termo.trim().toLowerCase();

  if (termoNormalizado === "") {
    return listaDeLivros;
  }

  return listaDeLivros.filter((livro) => {
    return (
      livro.titulo.toLowerCase().includes(termoNormalizado) ||
      livro.autor.toLowerCase().includes(termoNormalizado)
    );
  });
}

// Sempre que o usuário digitar algo no campo de busca...
campoDeBusca.addEventListener("input", (evento) => {
  const livrosFiltrados = filtrarLivros(evento.target.value);
  renderizarLivros(livrosFiltrados);
});

// Ao carregar a página pela primeira vez, mostramos todos os livros.
renderizarLivros(listaDeLivros);
