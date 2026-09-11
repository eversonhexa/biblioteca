// ==========================================================
// Aula 3 — formulário de cadastro de livros
//
// Este script:
//   1. Valida os campos do formulário "na mão" (sem depender
//      só da validação automática do navegador);
//   2. Se estiver tudo certo, guarda o livro em um array
//      (só na memória do navegador) e mostra numa tabelinha
//      logo abaixo do formulário.
//
// IMPORTANTE: como ainda não existe backend nem banco de dados,
// os livros cadastrados aqui NÃO aparecem na tela "Acervo" e
// somem se a página for recarregada. Isso é esperado nesta
// aula — resolveremos quando estudarmos Node.js + MySQL.
// ==========================================================

const formulario = document.getElementById("form-cadastro");
const campoAlerta = document.getElementById("alerta");
const corpoTabelaCadastrados = document.getElementById("tabela-cadastrados-corpo");

// Lista dos livros cadastrados NESTA sessão (some ao recarregar a página)
const livrosCadastrados = [];

// Mostra uma mensagem de erro embaixo de um campo específico
// e marca o campo visualmente como inválido.
function mostrarErroDoCampo(idCampo, mensagem) {
  const campoErro = document.getElementById(`erro-${idCampo}`);
  const input = document.getElementById(idCampo);

  campoErro.textContent = mensagem;
  input.classList.add("campo__input--invalido");
}

// Limpa todas as mensagens de erro antes de validar de novo.
function limparErros() {
  document.querySelectorAll(".campo__erro").forEach((elemento) => {
    elemento.textContent = "";
  });
  document.querySelectorAll(".campo__input--invalido").forEach((elemento) => {
    elemento.classList.remove("campo__input--invalido");
  });
}

// Mostra a faixa verde (sucesso) ou vermelha (erro) acima da tabela.
function mostrarAlerta(tipo, mensagem) {
  campoAlerta.textContent = mensagem;
  campoAlerta.className = `alerta alerta--${tipo}`; // troca as classes de uma vez
  campoAlerta.hidden = false;
}

// Valida os campos do formulário. Devolve um objeto com os
// dados já "limpos" (trim) se tudo estiver certo, ou null
// se algum campo estiver inválido (e já mostra os erros).
function validarFormulario() {
  limparErros();

  const titulo = formulario.titulo.value.trim();
  const autor = formulario.autor.value.trim();
  const categoria = formulario.categoria.value;
  const ano = Number(formulario.ano.value);
  const anoAtual = new Date().getFullYear();

  let valido = true;

  if (titulo.length < 2) {
    mostrarErroDoCampo("titulo", "Informe o título do livro (mínimo 2 letras).");
    valido = false;
  }

  if (autor.length < 2) {
    mostrarErroDoCampo("autor", "Informe o nome do autor (mínimo 2 letras).");
    valido = false;
  }

  if (categoria === "") {
    mostrarErroDoCampo("categoria", "Selecione uma categoria.");
    valido = false;
  }

  if (!formulario.ano.value || ano < 1000 || ano > anoAtual) {
    mostrarErroDoCampo("ano", `Informe um ano entre 1000 e ${anoAtual}.`);
    valido = false;
  }

  if (!valido) {
    return null;
  }

  return { titulo, autor, categoria, ano };
}

// Desenha a tabela de livros cadastrados nesta sessão.
function renderizarCadastrados() {
  corpoTabelaCadastrados.innerHTML = "";

  livrosCadastrados.forEach((livro) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.categoria}</td>
      <td>${livro.ano}</td>
    `;
    corpoTabelaCadastrados.appendChild(linha);
  });
}

// Evento principal: quando o formulário é enviado.
formulario.addEventListener("submit", (evento) => {
  // Impede o comportamento padrão do navegador, que seria
  // recarregar a página (já que não temos um servidor para
  // receber esses dados ainda).
  evento.preventDefault();

  const dadosValidados = validarFormulario();

  if (!dadosValidados) {
    mostrarAlerta("erro", "Corrija os campos destacados abaixo antes de continuar.");
    return;
  }

  const novoLivro = {
    id: Date.now(),          // um jeito simples e único de gerar um id por enquanto
    ...dadosValidados,        // titulo, autor, categoria, ano
    status: "disponivel",
  };

  livrosCadastrados.push(novoLivro);
  renderizarCadastrados();

  mostrarAlerta("sucesso", `Livro "${novoLivro.titulo}" cadastrado nesta sessão com sucesso!`);
  formulario.reset();
});
