// ==========================================================
// Aula 4 — controle de empréstimos (versão inicial, em memória)
// Aula 9 — integrado de verdade com o backend/MySQL
//
// A regra de negócio ("só empresta livro disponível") saiu
// daqui e foi para o servidor (server.js) — o que fazemos
// agora é: buscar dados prontos da API, montar o pedido de
// empréstimo/devolução, e mostrar a resposta que o servidor
// devolver (seja sucesso, seja um erro de regra de negócio).
//
// Aula 11 — URLs relativas; e o formulário de empréstimo, mais o
// botão "Registrar devolução", agora exigem login. A regra de
// verdade já está protegida no SERVIDOR (POST/PUT exigem sessão
// — veja backend/routes/emprestimos.js); aqui na tela só
// escondemos os controles para quem não está logado, como
// conveniência — é por isso que tratamos também o status 401
// que pode voltar do servidor (ex.: sessão expirou no meio da
// visita).
// ==========================================================

const URL_API_LIVROS = "/api/livros";
const URL_API_ALUNOS = "/api/alunos";
const URL_API_EMPRESTIMOS = "/api/emprestimos";

// Guardamos aqui o resultado de obterSessaoAtual() (definida em
// js/auth.js), consultado uma vez ao carregar a página.
let sessaoAtual = null;

const mensagemLoginNecessario = document.getElementById("mensagem-login-necessario");
const formularioEmprestimo = document.getElementById("form-emprestimo");
const selectLivro = document.getElementById("livro");
const selectAluno = document.getElementById("aluno");
const campoAlertaEmprestimo = document.getElementById("alerta");
const mensagemCarregando = document.getElementById("mensagem-carregando");
const corpoTabelaAtivos = document.getElementById("tabela-emprestimos-corpo");
const corpoTabelaHistorico = document.getElementById("tabela-historico-corpo");
const mensagemSemEmprestimos = document.getElementById("mensagem-sem-emprestimos");
const mensagemSemHistorico = document.getElementById("mensagem-sem-historico");

// ---------- Funções de data (mesmo padrão das aulas anteriores) ----------

function obterDataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarDataBR(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

// ---------- Funções auxiliares de validação/alerta ----------

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
  campoAlertaEmprestimo.textContent = mensagem;
  campoAlertaEmprestimo.className = `alerta alerta--${tipo}`;
  campoAlertaEmprestimo.hidden = false;
}

// ---------- Carregar dados da API ----------

// Busca os livros e preenche o select só com os disponíveis.
// A filtragem por "disponivel" continua sendo feita aqui no
// frontend (a API devolve todos os livros) — é só uma questão
// de conveniência da tela, não é a regra de negócio em si (essa
// já está garantida no servidor, na rota POST /api/emprestimos).
async function carregarLivrosDisponiveis() {
  const resposta = await fetch(URL_API_LIVROS);
  if (!resposta.ok) throw new Error("Falha ao buscar livros.");
  const livros = await resposta.json();

  const livrosDisponiveis = livros.filter((livro) => livro.status === "disponivel");

  selectLivro.length = 1; // mantém só a primeira opção ("Selecione...")
  livrosDisponiveis.forEach((livro) => {
    const opcao = document.createElement("option");
    opcao.value = livro.id;
    opcao.textContent = `${livro.titulo} — ${livro.autor}`;
    selectLivro.appendChild(opcao);
  });
  selectLivro.disabled = livrosDisponiveis.length === 0;
}

async function carregarAlunos() {
  const resposta = await fetch(URL_API_ALUNOS);
  if (!resposta.ok) throw new Error("Falha ao buscar alunos.");
  const alunos = await resposta.json();

  selectAluno.length = 1;
  alunos.forEach((aluno) => {
    const opcao = document.createElement("option");
    opcao.value = aluno.id;
    opcao.textContent = aluno.turma ? `${aluno.nome} (${aluno.turma})` : aluno.nome;
    selectAluno.appendChild(opcao);
  });
}

async function carregarEmprestimosAtivos() {
  const resposta = await fetch(URL_API_EMPRESTIMOS);
  if (!resposta.ok) throw new Error("Falha ao buscar empréstimos ativos.");
  const emprestimos = await resposta.json();
  renderizarEmprestimosAtivos(emprestimos);
}

async function carregarHistorico() {
  const resposta = await fetch(`${URL_API_EMPRESTIMOS}?status=historico`);
  if (!resposta.ok) throw new Error("Falha ao buscar o histórico.");
  const historico = await resposta.json();
  renderizarHistorico(historico);
}

// Recarrega tudo que pode ter mudado depois de um
// empréstimo/devolução: a lista de livros disponíveis (para o
// select), os empréstimos ativos e o histórico.
async function recarregarTudo() {
  await Promise.all([carregarLivrosDisponiveis(), carregarEmprestimosAtivos(), carregarHistorico()]);
}

// ---------- Renderização das tabelas ----------

function renderizarEmprestimosAtivos(emprestimos) {
  corpoTabelaAtivos.innerHTML = "";

  emprestimos.forEach((emprestimo) => {
    // O botão de devolução só aparece para quem está logado —
    // quem não está nem precisa ver um botão que, ao clicar,
    // só devolveria um 401 do servidor.
    const celulaAcao = sessaoAtual
      ? `<button type="button" class="botao botao--secundario" data-id="${emprestimo.id}">Registrar devolução</button>`
      : "—";

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${emprestimo.livroTitulo}</td>
      <td>${emprestimo.alunoNome}</td>
      <td>${formatarDataBR(emprestimo.dataEmprestimo)}</td>
      <td>${formatarDataBR(emprestimo.dataPrevista)}</td>
      <td>${celulaAcao}</td>
    `;
    corpoTabelaAtivos.appendChild(linha);
  });

  mensagemSemEmprestimos.hidden = emprestimos.length > 0;
}

function renderizarHistorico(historico) {
  corpoTabelaHistorico.innerHTML = "";

  historico.forEach((emprestimo) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${emprestimo.livroTitulo}</td>
      <td>${emprestimo.alunoNome}</td>
      <td>${formatarDataBR(emprestimo.dataEmprestimo)}</td>
      <td>${formatarDataBR(emprestimo.dataPrevista)}</td>
      <td>${formatarDataBR(emprestimo.dataDevolucao)}</td>
    `;
    corpoTabelaHistorico.appendChild(linha);
  });

  mensagemSemHistorico.hidden = historico.length > 0;
}

// ---------- Registrar um novo empréstimo ----------

function validarFormularioEmprestimo() {
  limparErros();

  const livroId = selectLivro.value;
  const alunoId = selectAluno.value;
  const dataPrevista = formularioEmprestimo["data-prevista"].value;
  const hojeISO = obterDataHojeISO();

  let valido = true;

  if (!livroId) {
    mostrarErroDoCampo("livro", "Selecione um livro.");
    valido = false;
  }
  if (!alunoId) {
    mostrarErroDoCampo("aluno", "Selecione um aluno.");
    valido = false;
  }
  if (!dataPrevista || dataPrevista < hojeISO) {
    mostrarErroDoCampo("data-prevista", "Escolha uma data igual ou posterior a hoje.");
    valido = false;
  }

  if (!valido) return null;

  return { livroId: Number(livroId), alunoId: Number(alunoId), dataPrevista };
}

formularioEmprestimo.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const dados = validarFormularioEmprestimo();
  if (!dados) {
    mostrarAlerta("erro", "Corrija os campos destacados abaixo antes de continuar.");
    return;
  }

  try {
    const resposta = await fetch(URL_API_EMPRESTIMOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    // O corpo da resposta (sucesso OU erro) sempre vem em JSON,
    // então lemos ele independente do status.
    const corpo = await resposta.json();

    if (!resposta.ok) {
      if (resposta.status === 401) {
        mostrarAlerta("erro", "Sua sessão expirou. Faça login novamente para registrar empréstimos.");
        await atualizarEstadoLogin();
        return;
      }
      // Aqui mostramos a mensagem que o SERVIDOR mandou (ex.:
      // "Este livro não está disponível para empréstimo."),
      // que é a regra de negócio real sendo aplicada.
      mostrarAlerta("erro", corpo.erro || "Não foi possível registrar o empréstimo.");
      return;
    }

    mostrarAlerta("sucesso", "Empréstimo registrado com sucesso.");
    formularioEmprestimo.reset();
    await recarregarTudo();
  } catch (erro) {
    console.error("Falha de rede ao registrar empréstimo:", erro);
    mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
  }
});

// ---------- Registrar uma devolução ----------

// Delegação de evento: um único listener no <tbody> cobre todos
// os botões "Registrar devolução", mesmo os recriados a cada
// renderização.
corpoTabelaAtivos.addEventListener("click", async (evento) => {
  const botao = evento.target.closest("button[data-id]");
  if (!botao) return;

  const id = botao.dataset.id;

  try {
    const resposta = await fetch(`${URL_API_EMPRESTIMOS}/${id}/devolucao`, {
      method: "PUT",
    });
    const corpo = await resposta.json();

    if (!resposta.ok) {
      if (resposta.status === 401) {
        mostrarAlerta("erro", "Sua sessão expirou. Faça login novamente para registrar devoluções.");
        await atualizarEstadoLogin();
        return;
      }
      mostrarAlerta("erro", corpo.erro || "Não foi possível registrar a devolução.");
      return;
    }

    mostrarAlerta("sucesso", "Devolução registrada com sucesso.");
    await recarregarTudo();
  } catch (erro) {
    console.error("Falha de rede ao registrar devolução:", erro);
    mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
  }
});

// ---------- Login (Aula 11) ----------

// Consulta a sessão atual e mostra/esconde o formulário de
// empréstimo de acordo. A tabela de consulta continua visível
// para todo mundo, logado ou não.
async function atualizarEstadoLogin() {
  sessaoAtual = await obterSessaoAtual();

  formularioEmprestimo.hidden = !sessaoAtual;
  mensagemLoginNecessario.hidden = Boolean(sessaoAtual);
}

// ---------- Inicialização da página ----------

async function inicializar() {
  document.getElementById("data-prevista").min = obterDataHojeISO();
  mensagemCarregando.hidden = false;

  try {
    await atualizarEstadoLogin();
    await Promise.all([carregarLivrosDisponiveis(), carregarAlunos(), carregarEmprestimosAtivos(), carregarHistorico()]);
  } catch (erro) {
    console.error("Falha ao carregar dados iniciais:", erro);
    mostrarAlerta(
      "erro",
      "Não foi possível carregar os dados. Verifique se o backend está rodando (npm run dev, na pasta backend) e recarregue a página."
    );
  } finally {
    mensagemCarregando.hidden = true;
  }
}

inicializar();
