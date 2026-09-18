// ==========================================================
// Aula 2 — tela de listagem do acervo
// Aula 8 — os livros passaram a vir do BACKEND, via fetch(),
//           em vez do array fixo js/dados-acervo.js
// Aula 11 — URL relativa, em vez de fixar "http://localhost:3000"
// ==========================================================

// URL relativa: o navegador resolve isso em relação à própria
// página que fez o pedido. Só funciona quando o frontend é
// aberto a partir do próprio backend (http://localhost:3000/...
// ou http://<IP-do-servidor>:3000/...) — veja a Aula 10, seção 9.
const URL_API_LIVROS = "/api/livros";

// Elementos do HTML que vamos manipular
const corpoDaTabela = document.getElementById("tabela-acervo-corpo");
const campoDeBusca = document.getElementById("campo-busca");
const mensagemVazio = document.getElementById("mensagem-vazio");
const mensagemCarregando = document.getElementById("mensagem-carregando");
const alertaAcervo = document.getElementById("alerta");

// Guardamos aqui, em uma variável do módulo, os livros que
// vieram do servidor — antes, esse papel era do array
// "listaDeLivros" importado de dados-acervo.js.
let livros = [];

// Traduz o "status" salvo nos dados (disponivel/emprestado)
// para um texto e uma classe CSS de cor.
function formatarStatus(status) {
  if (status === "disponivel") {
    return { texto: "Disponível", classe: "badge--disponivel" };
  }
  return { texto: "Emprestado", classe: "badge--emprestado" };
}

function mostrarAlerta(tipo, mensagem) {
  alertaAcervo.textContent = mensagem;
  alertaAcervo.className = `alerta alerta--${tipo}`;
  alertaAcervo.hidden = false;
}

// Recebe um array de livros e desenha a tabela inteira.
// Sempre que a busca mudar, chamamos essa função de novo
// com a lista já filtrada.
function renderizarLivros(listaParaMostrar) {
  corpoDaTabela.innerHTML = "";

  mensagemVazio.hidden = listaParaMostrar.length > 0;

  listaParaMostrar.forEach((livro) => {
    const status = formatarStatus(livro.status);

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.categoria}</td>
      <td>${livro.ano}</td>
      <td>${livro.isbn || "—"}</td>
      <td><span class="badge ${status.classe}">${status.texto}</span></td>
    `;

    corpoDaTabela.appendChild(linha);
  });
}

// Filtra a lista de livros (já carregada) pelo texto digitado
// no campo de busca. Repare que isso continua acontecendo
// aqui no navegador, sobre os dados que já baixamos — não
// fazemos uma requisição nova ao servidor a cada letra digitada.
function filtrarLivros(termo) {
  const termoNormalizado = termo.trim().toLowerCase();

  if (termoNormalizado === "") {
    return livros;
  }

  return livros.filter((livro) => {
    return (
      livro.titulo.toLowerCase().includes(termoNormalizado) ||
      livro.autor.toLowerCase().includes(termoNormalizado)
    );
  });
}

// Busca os livros no backend. É aqui que a integração
// realmente acontece.
async function carregarLivros() {
  mensagemCarregando.hidden = false;
  mensagemVazio.hidden = true;

  try {
    const resposta = await fetch(URL_API_LIVROS);

    // fetch() só "cai" no catch em caso de falha de REDE (ex.:
    // servidor desligado). Uma resposta de erro HTTP (como um
    // 500) ainda chega aqui normalmente — por isso conferimos
    // "resposta.ok" na mão.
    if (!resposta.ok) {
      throw new Error(`O servidor respondeu com status ${resposta.status}`);
    }

    livros = await resposta.json();
    renderizarLivros(livros);
  } catch (erro) {
    console.error("Falha ao carregar o acervo:", erro);
    mostrarAlerta(
      "erro",
      "Não foi possível carregar o acervo. Verifique se o backend está rodando (npm run dev, na pasta backend) e recarregue a página."
    );
  } finally {
    mensagemCarregando.hidden = true;
  }
}

// Sempre que o usuário digitar algo no campo de busca...
campoDeBusca.addEventListener("input", (evento) => {
  const livrosFiltrados = filtrarLivros(evento.target.value);
  renderizarLivros(livrosFiltrados);
});

// Ao carregar a página, buscamos os livros no servidor.
carregarLivros();
