// ==========================================================
// Aula 12 — cadastro de alunos
//
// Mesmo padrão do cadastro de livros (Aulas 3 e 11): validação
// "na mão" no navegador (feedback rápido) + POST /api/alunos de
// verdade no servidor (proteção real, incluindo exigir login).
//
// Ajuste (cadastro de alunos) — a lista abaixo do formulário
// passou a mostrar TODOS os alunos já cadastrados no banco (não
// só os desta visita), buscando em GET /api/alunos, com a opção
// de editar nome e turma de qualquer um deles, via
// PUT /api/alunos/:id — útil porque o aluno muda de turma de um
// ano para o outro, e isso não tinha como ser corrigido antes.
// ==========================================================

const URL_API_ALUNOS = "/api/alunos";

const mensagemLoginNecessario = document.getElementById("mensagem-login-necessario");
const formulario = document.getElementById("form-cadastro-aluno");
const campoAlerta = document.getElementById("alerta");
const corpoTabelaCadastrados = document.getElementById("tabela-cadastrados-corpo");
const mensagemCarregandoAlunos = document.getElementById("mensagem-carregando-alunos");
const mensagemSemAlunos = document.getElementById("mensagem-sem-alunos");

// Lista de alunos já cadastrados no banco, carregada do servidor
// (ver carregarAlunos()). "idEmEdicao" guarda o id da linha que
// está sendo editada no momento (ou null, se nenhuma) — é o que
// renderizarAlunos() usa para decidir se desenha aquela linha como
// texto normal ou como campos editáveis.
let alunos = [];
let idEmEdicao = null;

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

// Mesma regra usada tanto no cadastro quanto na edição de um aluno
// já existente — devolve uma lista de mensagens de erro (vazia
// quando os dados estão certos).
function validarNomeTurma(nome, turma) {
  const erros = [];

  if (nome.length < 2) {
    erros.push("Informe o nome do aluno (mínimo 2 letras).");
  }
  if (turma.length > 30) {
    erros.push("A turma pode ter no máximo 30 caracteres.");
  }

  return erros;
}

// Valida os campos do formulário de cadastro. Assim como em
// cadastro.js, esta validação é repetida de forma independente no
// servidor (backend/routes/alunos.js) — a desta tela é só
// conveniência.
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

// Desenha a tabela de alunos cadastrados no banco. A linha cujo id
// é igual a "idEmEdicao" aparece com campos editáveis e os botões
// "Salvar"/"Cancelar"; todas as outras mostram só o texto e o
// botão "Editar".
function renderizarAlunos() {
  corpoTabelaCadastrados.innerHTML = "";

  if (alunos.length === 0) {
    mensagemSemAlunos.hidden = false;
    return;
  }
  mensagemSemAlunos.hidden = true;

  alunos.forEach((aluno) => {
    const linha = document.createElement("tr");
    // data-id na própria linha: dá um jeito estável de localizar a
    // linha de um aluno específico mesmo enquanto ela está em modo
    // de edição (quando o nome deixa de aparecer como texto simples
    // e passa a ser o VALOR de um <input>).
    linha.dataset.id = aluno.id;

    if (aluno.id === idEmEdicao) {
      linha.innerHTML = `
        <td><input type="text" class="campo-edicao-nome" value="${aluno.nome}" minlength="2"></td>
        <td><input type="text" class="campo-edicao-turma" value="${aluno.turma || ""}" maxlength="30" placeholder="Ex.: 9º A"></td>
        <td>
          <button type="button" class="botao botao--primario" data-acao="salvar" data-id="${aluno.id}">Salvar</button>
          <button type="button" class="botao botao--secundario" data-acao="cancelar" data-id="${aluno.id}">Cancelar</button>
        </td>
      `;
    } else {
      linha.innerHTML = `
        <td>${aluno.nome}</td>
        <td>${aluno.turma || "—"}</td>
        <td><button type="button" class="botao botao--secundario" data-acao="editar" data-id="${aluno.id}">Editar</button></td>
      `;
    }

    corpoTabelaCadastrados.appendChild(linha);
  });
}

// Busca a lista completa de alunos no servidor e redesenha a
// tabela. Chamada ao carregar a página (se já houver sessão) e de
// novo depois de qualquer cadastro ou edição, para a tabela nunca
// ficar desatualizada em relação ao banco.
async function carregarAlunos() {
  mensagemCarregandoAlunos.hidden = false;
  mensagemSemAlunos.hidden = true;
  corpoTabelaCadastrados.innerHTML = "";

  try {
    const resposta = await fetch(URL_API_ALUNOS);

    if (!resposta.ok) {
      if (resposta.status === 401) {
        // A sessão pode ter expirado — protegerPagina() já cuida de
        // esconder o formulário; aqui só evitamos desenhar uma
        // tabela com dados velhos.
        return;
      }
      throw new Error("Falha ao buscar alunos.");
    }

    alunos = await resposta.json();
    renderizarAlunos();
  } catch (erro) {
    console.error("Falha ao carregar alunos:", erro);
    mostrarAlerta("erro", "Não foi possível carregar a lista de alunos.");
  } finally {
    mensagemCarregandoAlunos.hidden = true;
  }
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

    mostrarAlerta("sucesso", `Aluno "${corpo.aluno.nome}" cadastrado com sucesso!`);
    formulario.reset();
    await carregarAlunos();
  } catch (erro) {
    console.error("Falha de rede ao cadastrar aluno:", erro);
    mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
  }
});

// Um único listener na tabela (em vez de um por botão) porque as
// linhas são recriadas a cada renderizarAlunos() — colocando o
// listener nos botões, eles seriam perdidos a cada atualização.
corpoTabelaCadastrados.addEventListener("click", async (evento) => {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;

  const id = Number(botao.dataset.id);
  const acao = botao.dataset.acao;

  if (acao === "editar") {
    idEmEdicao = id;
    renderizarAlunos();
    return;
  }

  if (acao === "cancelar") {
    idEmEdicao = null;
    renderizarAlunos();
    return;
  }

  if (acao === "salvar") {
    const linha = botao.closest("tr");
    const nome = linha.querySelector(".campo-edicao-nome").value.trim();
    const turma = linha.querySelector(".campo-edicao-turma").value.trim();

    const erros = validarNomeTurma(nome, turma);
    if (erros.length > 0) {
      mostrarAlerta("erro", erros.join(" "));
      return;
    }

    try {
      const resposta = await fetch(`${URL_API_ALUNOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, turma }),
      });

      const corpo = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 401) {
          mostrarAlerta("erro", "Sua sessão expirou. Faça login novamente para editar alunos.");
          await protegerPagina();
          return;
        }
        mostrarAlerta("erro", corpo.erro || "Não foi possível atualizar o aluno.");
        return;
      }

      idEmEdicao = null;
      mostrarAlerta("sucesso", `Aluno "${corpo.aluno.nome}" atualizado com sucesso!`);
      await carregarAlunos();
    } catch (erro) {
      console.error("Falha de rede ao atualizar aluno:", erro);
      mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
    }
  }
});

// ---------- Login (Aula 11/12) ----------

async function protegerPagina() {
  const sessao = await obterSessaoAtual();

  formulario.hidden = !sessao;
  mensagemLoginNecessario.hidden = Boolean(sessao);

  if (sessao) {
    await carregarAlunos();
  }
}

protegerPagina();
