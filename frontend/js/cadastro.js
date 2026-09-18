// ==========================================================
// Aula 3 — formulário de cadastro de livros (validação "na mão"
//           e uma tabelinha só em memória, sem backend)
//
// Aula 11 — cadastro de verdade: este formulário passou a
// exigir login e a gravar no banco de verdade, via
// POST /api/livros (backend/routes/livros.js). Até aqui, esta
// tela só guardava os livros na memória do navegador — qualquer
// pessoa, logada ou não, conseguia "cadastrar" e nada era salvo.
// Agora, sem estar logado, o formulário nem aparece; e mesmo que
// alguém tentasse chamar a API direto sem sessão, o servidor
// recusaria com 401 (a proteção que realmente importa é essa,
// no servidor — a tela só evita o usuário tentar à toa).
//
// Ajuste (depois da Aula 11) — campo ISBN, opcional, validado
// tanto aqui (feedback rápido) quanto no servidor (proteção real).
// ==========================================================

const URL_API_LIVROS = "/api/livros";

// Tira tudo que não for dígito (hífens, espaços) — assim aceitamos
// tanto "9788535902775" quanto "978-85-359-0277-5" digitados.
function normalizarIsbn(valor) {
  return valor.replace(/[^0-9]/g, "");
}

const mensagemLoginNecessario = document.getElementById("mensagem-login-necessario");
const formulario = document.getElementById("form-cadastro");
const campoAlerta = document.getElementById("alerta");
const corpoTabelaCadastrados = document.getElementById("tabela-cadastrados-corpo");

// Lista dos livros cadastrados NESTA visita à página (é só uma
// conveniência visual — quem quiser ver tudo que já existe no
// acervo deve ir até a tela Acervo, que consulta o banco inteiro).
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
//
// Repare que esta validação é IDÊNTICA à que o servidor faz de
// novo em POST /api/livros. Isso não é duplicação por descuido:
// a validação aqui é só para dar feedback rápido, sem esperar o
// servidor; a validação de lá é a que realmente protege o banco,
// porque a desta tela pode sempre ser pulada por quem quiser.
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

  // ISBN é opcional — só validamos o formato quando algo foi digitado.
  const isbn = normalizarIsbn(formulario.isbn.value);
  if (isbn !== "" && isbn.length !== 13) {
    mostrarErroDoCampo("isbn", "O ISBN, se informado, deve ter 13 dígitos.");
    valido = false;
  }

  if (!valido) {
    return null;
  }

  return { titulo, autor, categoria, ano, isbn };
}

// Desenha a tabela de livros cadastrados nesta visita.
function renderizarCadastrados() {
  corpoTabelaCadastrados.innerHTML = "";

  livrosCadastrados.forEach((livro) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.categoria}</td>
      <td>${livro.ano}</td>
      <td>${livro.isbn || "—"}</td>
    `;
    corpoTabelaCadastrados.appendChild(linha);
  });
}

// Evento principal: quando o formulário é enviado.
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const dadosValidados = validarFormulario();

  if (!dadosValidados) {
    mostrarAlerta("erro", "Corrija os campos destacados abaixo antes de continuar.");
    return;
  }

  try {
    const resposta = await fetch(URL_API_LIVROS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosValidados),
    });

    // O corpo (sucesso OU erro) sempre vem em JSON.
    const corpo = await resposta.json();

    if (!resposta.ok) {
      if (resposta.status === 401) {
        // A sessão pode ter expirado enquanto a pessoa preenchia
        // o formulário. Atualizamos a tela para o estado
        // "deslogado" em vez de deixar o formulário visível
        // sem funcionar.
        mostrarAlerta("erro", "Sua sessão expirou. Faça login novamente para cadastrar livros.");
        await protegerPagina();
        return;
      }
      mostrarAlerta("erro", corpo.erro || "Não foi possível cadastrar o livro.");
      return;
    }

    livrosCadastrados.push(corpo.livro);
    renderizarCadastrados();

    mostrarAlerta("sucesso", `Livro "${corpo.livro.titulo}" cadastrado com sucesso!`);
    formulario.reset();
  } catch (erro) {
    console.error("Falha de rede ao cadastrar livro:", erro);
    mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
  }
});

// ---------- Login (Aula 11) ----------

// Consulta a sessão atual e mostra o formulário só para quem
// está logado. Quem não está logado vê apenas a mensagem
// pedindo para entrar — o formulário fica com "hidden".
async function protegerPagina() {
  const sessao = await obterSessaoAtual();

  formulario.hidden = !sessao;
  mensagemLoginNecessario.hidden = Boolean(sessao);
}

protegerPagina();
