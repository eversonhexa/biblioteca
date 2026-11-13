// ==========================================================
// Evolução 1 — consulta, empréstimo e devolução, tudo em uma
// tela só.
//
// Antes, eram duas telas: "Acervo" (só consulta, de graça para
// qualquer um) e "Empréstimos" (um formulário com <select> de
// livro + <select> de aluno, mais duas tabelas separadas de
// ativos/histórico). Agora:
//
//   - A consulta exige login (ver backend/routes/livros.js).
//   - GET /api/livros já devolve, para cada livro emprestado,
//     quem pegou e até quando — então a MESMA tabela de busca
//     mostra o status completo, sem precisar de uma segunda
//     tabela de "empréstimos ativos".
//   - Em vez de escolher o livro numa lista separada, a pessoa
//     clica em "Emprestar" na própria linha do livro desejado —
//     um pequeno painel aparece só para escolher o aluno e a
//     data prevista. Clicar em "Registrar devolução" já
//     executa a devolução direto, sem formulário.
// ==========================================================

const URL_API_LIVROS = "/api/livros";
const URL_API_ALUNOS = "/api/alunos";
const URL_API_EMPRESTIMOS = "/api/emprestimos";

const mensagemLoginNecessario = document.getElementById("mensagem-login-necessario");
const conteudoProtegido = document.getElementById("conteudo-protegido");

const campoAlerta = document.getElementById("alerta");
const campoDeBusca = document.getElementById("campo-busca");
const mensagemVazio = document.getElementById("mensagem-vazio");
const mensagemCarregando = document.getElementById("mensagem-carregando");
const corpoDaTabelaAcervo = document.getElementById("tabela-acervo-corpo");

const painelEmprestimo = document.getElementById("painel-emprestimo");
const painelEmprestimoTitulo = document.getElementById("painel-emprestimo-titulo");
const formularioEmprestimo = document.getElementById("form-emprestimo");
const campoLivroId = document.getElementById("livro-id");
const selectAluno = document.getElementById("aluno");
const botaoCancelarEmprestimo = document.getElementById("botao-cancelar-emprestimo");

const corpoTabelaHistorico = document.getElementById("tabela-historico-corpo");
const mensagemSemHistorico = document.getElementById("mensagem-sem-historico");

// Guardamos aqui, em uma variável do módulo, os livros que vieram
// do servidor (já com os dados do empréstimo ativo embutidos).
let livros = [];

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

// ---------- Alerta e validação (mesmo padrão das aulas anteriores) ----------

function mostrarAlerta(tipo, mensagem) {
  campoAlerta.textContent = mensagem;
  campoAlerta.className = `alerta alerta--${tipo}`;
  campoAlerta.hidden = false;
}

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

// ---------- Carregar dados da API ----------

async function carregarLivros() {
  const resposta = await fetch(URL_API_LIVROS);
  if (!resposta.ok) throw new Error("Falha ao buscar livros.");
  livros = await resposta.json();
}

async function carregarAlunos() {
  const resposta = await fetch(URL_API_ALUNOS);
  if (!resposta.ok) throw new Error("Falha ao buscar alunos.");
  const alunos = await resposta.json();

  selectAluno.length = 1; // mantém só a primeira opção ("Selecione...")
  alunos.forEach((aluno) => {
    const opcao = document.createElement("option");
    opcao.value = aluno.id;
    opcao.textContent = aluno.turma ? `${aluno.nome} (${aluno.turma})` : aluno.nome;
    selectAluno.appendChild(opcao);
  });
}

async function carregarHistorico() {
  const resposta = await fetch(`${URL_API_EMPRESTIMOS}?status=historico`);
  if (!resposta.ok) throw new Error("Falha ao buscar o histórico.");
  const historico = await resposta.json();
  renderizarHistorico(historico);
}

// Recarrega tudo que pode ter mudado depois de um
// empréstimo/devolução.
async function recarregarTudo() {
  await carregarLivros();
  renderizarLivros(filtrarLivros(campoDeBusca.value));
  await carregarHistorico();
}

// ---------- Renderização da tabela de acervo + empréstimos ----------

function formatarCelulaStatus(livro) {
  if (livro.status !== "emprestado") {
    return `<span class="badge badge--disponivel">Disponível</span>`;
  }

  const previsao = livro.dataPrevista ? formatarDataBR(livro.dataPrevista) : "—";
  const atrasado = livro.dataPrevista && livro.dataPrevista < obterDataHojeISO();

  return `
    <span class="badge badge--emprestado">Emprestado</span>
    <br>
    <small class="${atrasado ? "texto-atrasado" : ""}">
      Com ${livro.alunoNome || "—"} — devolução até ${previsao}${atrasado ? " (atrasado)" : ""}
    </small>
  `;
}

function formatarCelulaAcao(livro) {
  if (livro.status === "disponivel") {
    return `<button type="button" class="botao botao--secundario" data-acao="emprestar" data-id="${livro.id}" data-titulo="${livro.titulo} — ${livro.autor}">Emprestar</button>`;
  }
  return `<button type="button" class="botao botao--secundario" data-acao="devolver" data-emprestimo-id="${livro.emprestimoId}">Registrar devolução</button>`;
}

function renderizarLivros(listaParaMostrar) {
  corpoDaTabelaAcervo.innerHTML = "";

  mensagemVazio.hidden = listaParaMostrar.length > 0;

  listaParaMostrar.forEach((livro) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.categoria}</td>
      <td>${livro.ano}</td>
      <td>${livro.isbn || "—"}</td>
      <td>${formatarCelulaStatus(livro)}</td>
      <td>${formatarCelulaAcao(livro)}</td>
    `;
    corpoDaTabelaAcervo.appendChild(linha);
  });
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

// Filtra a lista de livros (já carregada) pelo texto digitado no
// campo de busca — igual à Aula 2, só que sobre os dados já
// enriquecidos com o empréstimo ativo.
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

campoDeBusca.addEventListener("input", (evento) => {
  renderizarLivros(filtrarLivros(evento.target.value));
});

// ---------- Painel de empréstimo (abre a partir da linha clicada) ----------

function abrirPainelEmprestimo(livroId, tituloEAutor) {
  limparErros();
  campoLivroId.value = livroId;
  painelEmprestimoTitulo.textContent = tituloEAutor;
  painelEmprestimo.hidden = false;
  painelEmprestimo.scrollIntoView({ behavior: "smooth", block: "center" });
}

function fecharPainelEmprestimo() {
  painelEmprestimo.hidden = true;
  formularioEmprestimo.reset();
  limparErros();
}

botaoCancelarEmprestimo.addEventListener("click", fecharPainelEmprestimo);

// Delegação de evento: um único listener no <tbody> cobre os
// botões "Emprestar" e "Registrar devolução" de todas as linhas,
// mesmo as recriadas a cada renderização (busca, recarregamento).
corpoDaTabelaAcervo.addEventListener("click", async (evento) => {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;

  if (botao.dataset.acao === "emprestar") {
    abrirPainelEmprestimo(botao.dataset.id, botao.dataset.titulo);
    return;
  }

  // data-acao === "devolver": executa direto, sem formulário.
  const idEmprestimo = botao.dataset.emprestimoId;
  try {
    const resposta = await fetch(`${URL_API_EMPRESTIMOS}/${idEmprestimo}/devolucao`, {
      method: "PUT",
    });
    const corpo = await resposta.json();

    if (!resposta.ok) {
      if (resposta.status === 401) {
        mostrarAlerta("erro", "Sua sessão expirou. Faça login novamente para registrar devoluções.");
        await verificarAcessoEInicializar();
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

// ---------- Confirmar o empréstimo ----------

function validarFormularioEmprestimo() {
  limparErros();

  const alunoId = selectAluno.value;
  const dataPrevista = formularioEmprestimo["data-prevista"].value;
  const hojeISO = obterDataHojeISO();

  let valido = true;

  if (!alunoId) {
    mostrarErroDoCampo("aluno", "Selecione um aluno.");
    valido = false;
  }
  if (!dataPrevista || dataPrevista < hojeISO) {
    mostrarErroDoCampo("data-prevista", "Escolha uma data igual ou posterior a hoje.");
    valido = false;
  }

  if (!valido) return null;

  return { livroId: Number(campoLivroId.value), alunoId: Number(alunoId), dataPrevista };
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

    const corpo = await resposta.json();

    if (!resposta.ok) {
      if (resposta.status === 401) {
        mostrarAlerta("erro", "Sua sessão expirou. Faça login novamente para registrar empréstimos.");
        await verificarAcessoEInicializar();
        return;
      }
      mostrarAlerta("erro", corpo.erro || "Não foi possível registrar o empréstimo.");
      return;
    }

    mostrarAlerta("sucesso", "Empréstimo registrado com sucesso.");
    fecharPainelEmprestimo();
    await recarregarTudo();
  } catch (erro) {
    console.error("Falha de rede ao registrar empréstimo:", erro);
    mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
  }
});

// ---------- Inicialização da página ----------

// Evolução 1 — a consulta inteira agora exige login. Se não houver
// sessão válida, nem tentamos carregar dados (a API responderia
// 401 de qualquer forma): mostramos só o aviso pedindo login.
async function verificarAcessoEInicializar() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    mensagemLoginNecessario.hidden = false;
    conteudoProtegido.hidden = true;
    return;
  }

  mensagemLoginNecessario.hidden = true;
  conteudoProtegido.hidden = false;

  document.getElementById("data-prevista").min = obterDataHojeISO();
  mensagemCarregando.hidden = false;

  try {
    await carregarLivros();
    renderizarLivros(livros);
    await Promise.all([carregarAlunos(), carregarHistorico()]);
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

verificarAcessoEInicializar();
