// ==========================================================
// Aula 5 — login simulado (comparava contra um array no navegador)
// Aula 10 — login de verdade: o servidor confere a senha contra
//           um hash guardado no banco (POST /api/login)
// Aula 11 — URL relativa (precisa ser aberta a partir do próprio
//           backend, http://localhost:3000/...) e redirecionamento
//           para a página inicial após o login, já que agora o
//           login cria uma sessão que vale para as outras páginas
// ==========================================================

const URL_API_LOGIN = "/api/login";

const formularioLogin = document.getElementById("form-login");
const campoSenha = document.getElementById("senha");
const checkboxMostrarSenha = document.getElementById("mostrar-senha");
const campoAlertaLogin = document.getElementById("alerta");

// ---------- Mostrar/ocultar senha ----------

checkboxMostrarSenha.addEventListener("change", () => {
  campoSenha.type = checkboxMostrarSenha.checked ? "text" : "password";
});

// ---------- Validação e alerta (mesmo padrão das aulas anteriores) ----------

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
      // A mensagem ("Usuário ou senha inválidos.") vem pronta
      // do servidor — é ele quem decide o que pode ser revelado.
      mostrarAlerta("erro", corpo.erro || "Não foi possível entrar.");
      return;
    }

    mostrarAlerta("sucesso", `Bem-vindo(a), ${corpo.nome}! Redirecionando...`);
    formularioLogin.reset();
    campoSenha.type = "password";
    checkboxMostrarSenha.checked = false;

    // Pequena pausa só para a pessoa conseguir ler a mensagem de
    // sucesso antes de sair da página.
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (erro) {
    console.error("Falha de rede ao tentar login:", erro);
    mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
  }
});
