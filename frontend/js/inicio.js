// ==========================================================
// Evolução 1 — a página inicial passou a ser a própria tela de
// login (antes, login.html era uma página separada).
//
// Comportamento:
//   - Ninguém logado  → mostra o formulário de login.
//   - Login com sucesso → sem redirecionar (já estamos na
//     página inicial!): troca o formulário pelo painel de
//     boas-vindas, mostrando a mensagem de confirmação.
//   - Login com erro → mensagem de erro aparece no próprio
//     formulário (igual às aulas anteriores).
//   - Alguém que já estava logado e volta ao Início → vê direto
//     o painel de boas-vindas, sem precisar logar de novo.
// ==========================================================

const URL_API_LOGIN = "/api/login";

const painelLogin = document.getElementById("painel-login");
const painelBoasVindas = document.getElementById("painel-boas-vindas");
const nomeUsuarioLogado = document.getElementById("nome-usuario-logado");

const formularioLogin = document.getElementById("form-login");
const campoSenha = document.getElementById("senha");
const checkboxMostrarSenha = document.getElementById("mostrar-senha");
const campoAlertaLogin = document.getElementById("alerta");

// ---------- Alternar entre os dois painéis ----------

function mostrarPainelBoasVindas(nome) {
  nomeUsuarioLogado.textContent = nome;
  painelBoasVindas.hidden = false;
  painelLogin.hidden = true;
}

function mostrarPainelLogin() {
  painelLogin.hidden = false;
  painelBoasVindas.hidden = true;
}

// ---------- Mostrar/ocultar senha ----------

checkboxMostrarSenha.addEventListener("change", () => {
  campoSenha.type = checkboxMostrarSenha.checked ? "text" : "password";
});

// ---------- Validação e alerta (mesmo padrão das outras telas) ----------

function mostrarErroDoCampo(idCampo, mensagem) {
  const campoErro = document.getElementById(`erro-${idCampo}`);
  const input = document.getElementById(idCampo);
  campoErro.textContent = mensagem;
  input.classList.add("campo__input--invalido");
}

function limparErros() {
  document.querySelectorAll(".campo__erro").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".campo__input--invalido").forEach((el) => {
    el.classList.remove("campo__input--invalido");
  });
}

function mostrarAlerta(tipo, mensagem) {
  campoAlertaLogin.textContent = mensagem;
  campoAlertaLogin.className = `alerta alerta--${tipo}`;
  campoAlertaLogin.hidden = false;
}

// ---------- Envio do formulário ----------

formularioLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limparErros();
  campoAlertaLogin.hidden = true;

  const usuario = formularioLogin.usuario.value.trim();
  const senha = formularioLogin.senha.value;

  let valido = true;

  if (usuario === "") {
    mostrarErroDoCampo("usuario", "Informe seu usuário.");
    valido = false;
  }
  if (senha === "") {
    mostrarErroDoCampo("senha", "Informe sua senha.");
    valido = false;
  }

  if (!valido) {
    mostrarAlerta("erro", "Preencha usuário e senha para continuar.");
    return;
  }

  try {
    const resposta = await fetch(URL_API_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha }),
    });

    const corpo = await resposta.json();

    if (!resposta.ok) {
      // A mensagem ("Usuário ou senha inválidos.") vem pronta do
      // servidor — é ele quem decide o que pode ser revelado.
      mostrarAlerta("erro", corpo.erro || "Não foi possível entrar.");
      return;
    }

    formularioLogin.reset();
    campoSenha.type = "password";
    checkboxMostrarSenha.checked = false;

    // Troca para o painel de boas-vindas, já confirmando o
    // sucesso do login — sem precisar redirecionar, porque esta
    // JÁ é a página inicial.
    mostrarPainelBoasVindas(corpo.nome);

    // script.js (carregado logo depois deste arquivo) define
    // atualizarLinkConta() — chamamos de novo aqui para o menu
    // já trocar "Entrar" por "Sair (nome)" na hora, sem precisar
    // recarregar a página.
    if (typeof atualizarLinkConta === "function") {
      atualizarLinkConta();
    }
  } catch (erro) {
    console.error("Falha de rede ao tentar login:", erro);
    mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
  }
});

// ---------- Ao carregar a página ----------

// Se já existe uma sessão válida neste navegador, nem mostramos o
// formulário — vamos direto para o painel de boas-vindas.
(async function inicializar() {
  const sessao = await obterSessaoAtual();
  if (sessao) {
    mostrarPainelBoasVindas(sessao.nome);
  } else {
    mostrarPainelLogin();
  }
})();
