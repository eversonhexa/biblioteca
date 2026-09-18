// ==========================================================
// Aula 12 — cadastro de alunos
//
// Mesmo padrão do cadastro de livros (Aulas 3 e 11): validação
// "na mão" no navegador (feedback rápido) + POST /api/alunos de
// verdade no servidor (proteção real, incluindo exigir login).
// ==========================================================

const URL_API_ALUNOS = "/api/alunos";

const mensagemLoginNecessario = document.getElementById("mensagem-login-necessario");
const formulario = document.getElementById("form-cadastro-aluno");
const campoAlerta = document.getElementById("alerta");
const corpoTabelaCadastrados = document.getElementById("tabela-cadastrados-corpo");

// Lista dos alunos cadastrados NESTA visita à página — só uma
// conveniência visual, como já fazíamos em cadastro.js.
const alunosCadastrados = [];

function mostrarErroDoCampo(idCampo, mensagem) {
  const campoErro = document.getElementById(`erro-${idCampo}`);
  const input = document.getElementById(idCampo);

  campoErro.textContent = mensagem;
  input.classList.add("campo__input--invalido");
}

function limparErros() {
  document.querySelectorAll(".campo__erro").forEach((elemento) => {
    elemento.textContent = "";
  });
  document.querySelectorAll(".campo__input--invalido").forEach((elemento) => {
    elemento.classList.remove("campo__input--invalido");
  });
}

function mostrarAlerta(tipo, mensagem) {
  campoAlerta.textContent = mensagem;
  campoAlerta.className = `alerta alerta--${tipo}`;
  campoAlerta.hidden = false;
}

// Valida os campos do formulário. Assim como em cadastro.js, esta
// validação é repetida de forma independente no servidor
// (backend/routes/alunos.js) — a desta tela é só conveniência.
function validarFormulario() {
  limparErros();

  const nome = formulario.nome.value.trim();
  const turma = formulario.turma.value.trim();

  let valido = true;

  if (nome.length < 2) {
    mostrarErroDoCampo("nome", "Informe o nome do aluno (mínimo 2 letras).");
    valido = false;
  }

  if (turma.length > 30) {
    mostrarErroDoCampo("turma", "A turma pode ter no máximo 30 caracteres.");
    valido = false;
  }

  if (!valido) {
    return null;
  }

  return { nome, turma };
}

// Desenha a tabela de alunos cadastrados nesta visita.
function renderizarCadastrados() {
  corpoTabelaCadastrados.innerHTML = "";

  alunosCadastrados.forEach((aluno) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${aluno.nome}</td>
      <td>${aluno.turma || "—"}</td>
    `;
    corpoTabelaCadastrados.appendChild(linha);
  });
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const dadosValidados = validarFormulario();

  if (!dadosValidados) {
    mostrarAlerta("erro", "Corrija os campos destacados abaixo antes de continuar.");
    return;
  }

  try {
    const resposta = await fetch(URL_API_ALUNOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosValidados),
    });

    const corpo = await resposta.json();

    if (!resposta.ok) {
      if (resposta.status === 401) {
        mostrarAlerta("erro", "Sua sessão expirou. Faça login novamente para cadastrar alunos.");
        await protegerPagina();
        return;
      }
      mostrarAlerta("erro", corpo.erro || "Não foi possível cadastrar o aluno.");
      return;
    }

    alunosCadastrados.push(corpo.aluno);
    renderizarCadastrados();

    mostrarAlerta("sucesso", `Aluno "${corpo.aluno.nome}" cadastrado com sucesso!`);
    formulario.reset();
  } catch (erro) {
    console.error("Falha de rede ao cadastrar aluno:", erro);
    mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
  }
});

// ---------- Login (Aula 11/12) ----------

async function protegerPagina() {
  const sessao = await obterSessaoAtual();

  formulario.hidden = !sessao;
  mensagemLoginNecessario.hidden = Boolean(sessao);
}

protegerPagina();
