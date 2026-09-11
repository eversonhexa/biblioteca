// ==========================================================
// Aula 5 — login simulado
//
// Confere o usuário/senha digitados contra o array
// "usuariosDeTeste" (de dados-usuarios.js). É só uma simulação
// para praticarmos o formulário — a autenticação de verdade,
// com senha criptografada e conferida no servidor, vem nas
// aulas de backend.
// ==========================================================

const formularioLogin = document.getElementById("form-login");
const campoSenha = document.getElementById("senha");
const checkboxMostrarSenha = document.getElementById("mostrar-senha");
const campoAlertaLogin = document.getElementById("alerta");

// ---------- Mostrar/ocultar senha ----------

// O input começa como type="password" (bolinhas no lugar do texto).
// Ao marcar o checkbox, trocamos o type para "text", revelando a senha.
checkboxMostrarSenha.addEventListener("change", () => {
  campoSenha.type = checkboxMostrarSenha.checked ? "text" : "password";
});

// ---------- Validação e alerta (mesmo padrão das aulas 3 e 4) ----------

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

formularioLogin.addEventListener("submit", (evento) => {
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

  // Procura, no array de usuários de teste, alguém com esse
  // usuário E essa senha ao mesmo tempo.
  const usuarioEncontrado = usuariosDeTeste.find(
    (item) => item.usuario === usuario && item.senha === senha
  );

  if (!usuarioEncontrado) {
    // De propósito, NÃO dizemos se o erro foi no usuário ou na
    // senha — só "usuário ou senha inválidos". Isso é uma boa
    // prática de segurança: não ajudar quem está tentando
    // adivinhar credenciais a saber qual dos dois campos errou.
    mostrarAlerta("erro", "Usuário ou senha inválidos.");
    return;
  }

  mostrarAlerta("sucesso", `Bem-vindo(a), ${usuarioEncontrado.nome}! (login simulado — sem sessão real ainda)`);
  formularioLogin.reset();
  campoSenha.type = "password";
  checkboxMostrarSenha.checked = false;
});
