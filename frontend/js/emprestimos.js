// ==========================================================
// Aula 4 — controle de empréstimos
//
// Reaproveita o array "listaDeLivros" (de dados-acervo.js) para
// saber quais livros estão disponíveis, e controla duas listas
// próprias desta tela, só na memória do navegador:
//   - emprestimosAtivos: empréstimos em andamento
//   - historicoDevolucoes: empréstimos já devolvidos
//
// Regra de negócio principal desta aula: só é possível
// emprestar um livro que esteja com status "disponivel", e ao
// emprestar, o status desse livro muda para "emprestado" (e
// volta para "disponivel" quando a devolução é registrada).
// ==========================================================

const formularioEmprestimo = document.getElementById("form-emprestimo");
const selectLivro = document.getElementById("livro");
const campoAlertaEmprestimo = document.getElementById("alerta");
const corpoTabelaAtivos = document.getElementById("tabela-emprestimos-corpo");
const corpoTabelaHistorico = document.getElementById("tabela-historico-corpo");
const mensagemSemEmprestimos = document.getElementById("mensagem-sem-emprestimos");
const mensagemSemHistorico = document.getElementById("mensagem-sem-historico");

const emprestimosAtivos = [];
const historicoDevolucoes = [];

// ---------- Funções de data ----------

// Devolve a data de hoje no formato "AAAA-MM-DD", que é o
// formato que o <input type="date"> exige internamente.
function obterDataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0"); // getMonth() começa em 0 (jan = 0)
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Converte "AAAA-MM-DD" para "DD/MM/AAAA", só para exibição.
function formatarDataBR(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

// ---------- Funções auxiliares de validação/alerta (mesmo padrão da aula 3) ----------

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

// ---------- Select de livros disponíveis ----------

// Preenche o <select> só com os livros que estão "disponivel".
// Chamada tanto ao carregar a página quanto depois de cada
// empréstimo/devolução, já que a disponibilidade muda.
function popularSelectDeLivros() {
  // Remove todas as opções, exceto a primeira ("Selecione um livro...")
  selectLivro.length = 1;

  const livrosDisponiveis = listaDeLivros.filter((livro) => livro.status === "disponivel");

  livrosDisponiveis.forEach((livro) => {
    const opcao = document.createElement("option");
    opcao.value = livro.id;
    opcao.textContent = `${livro.titulo} — ${livro.autor}`;
    selectLivro.appendChild(opcao);
  });

  // Se não sobrou nenhum livro disponível, avisamos no próprio select.
  selectLivro.disabled = livrosDisponiveis.length === 0;
}

// ---------- Renderização das tabelas ----------

function renderizarEmprestimosAtivos() {
  corpoTabelaAtivos.innerHTML = "";

  emprestimosAtivos.forEach((emprestimo) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${emprestimo.livroTitulo}</td>
      <td>${emprestimo.aluno}</td>
      <td>${formatarDataBR(emprestimo.dataEmprestimo)}</td>
      <td>${formatarDataBR(emprestimo.dataPrevista)}</td>
      <td><button type="button" class="botao botao--secundario" data-id="${emprestimo.id}">Registrar devolução</button></td>
    `;
    corpoTabelaAtivos.appendChild(linha);
  });

  mensagemSemEmprestimos.hidden = emprestimosAtivos.length > 0;
}

function renderizarHistorico() {
  corpoTabelaHistorico.innerHTML = "";

  historicoDevolucoes.forEach((emprestimo) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${emprestimo.livroTitulo}</td>
      <td>${emprestimo.aluno}</td>
      <td>${formatarDataBR(emprestimo.dataEmprestimo)}</td>
      <td>${formatarDataBR(emprestimo.dataPrevista)}</td>
      <td>${formatarDataBR(emprestimo.dataDevolucao)}</td>
    `;
    corpoTabelaHistorico.appendChild(linha);
  });

  mensagemSemHistorico.hidden = historicoDevolucoes.length > 0;
}

// ---------- Registrar um novo empréstimo ----------

function validarFormularioEmprestimo() {
  limparErros();

  const livroId = selectLivro.value;
  const aluno = formularioEmprestimo.aluno.value.trim();
  const dataPrevista = formularioEmprestimo["data-prevista"].value;
  const hojeISO = obterDataHojeISO();

  let valido = true;

  if (!livroId) {
    mostrarErroDoCampo("livro", "Selecione um livro.");
    valido = false;
  }

  if (aluno.length < 2) {
    mostrarErroDoCampo("aluno", "Informe o nome do aluno (mínimo 2 letras).");
    valido = false;
  }

  // Comparação de strings "AAAA-MM-DD" funciona como comparação de datas,
  // porque o formato tem sempre o mesmo tamanho (ano, depois mês, depois dia).
  if (!dataPrevista || dataPrevista < hojeISO) {
    mostrarErroDoCampo("data-prevista", "Escolha uma data igual ou posterior a hoje.");
    valido = false;
  }

  if (!valido) {
    return null;
  }

  return { livroId: Number(livroId), aluno, dataPrevista };
}

formularioEmprestimo.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const dados = validarFormularioEmprestimo();
  if (!dados) {
    mostrarAlerta("erro", "Corrija os campos destacados abaixo antes de continuar.");
    return;
  }

  const livro = listaDeLivros.find((item) => item.id === dados.livroId);

  const novoEmprestimo = {
    id: Date.now(),
    livroId: livro.id,
    livroTitulo: livro.titulo,
    aluno: dados.aluno,
    dataEmprestimo: obterDataHojeISO(),
    dataPrevista: dados.dataPrevista,
  };

  // Atualiza o status do livro em memória, para ele sumir do
  // select (não pode ser emprestado de novo enquanto não voltar).
  livro.status = "emprestado";

  emprestimosAtivos.push(novoEmprestimo);
  renderizarEmprestimosAtivos();
  popularSelectDeLivros();

  mostrarAlerta("sucesso", `Empréstimo de "${livro.titulo}" registrado para ${dados.aluno}.`);
  formularioEmprestimo.reset();
});

// ---------- Registrar uma devolução ----------

// Delegação de evento: em vez de um listener por botão (que teríamos
// que recriar toda vez que a tabela é redesenhada), colocamos UM
// listener no <tbody> e verificamos QUAL botão foi clicado.
corpoTabelaAtivos.addEventListener("click", (evento) => {
  const botao = evento.target.closest("button[data-id]");
  if (!botao) return;

  const idClicado = Number(botao.dataset.id);
  const indice = emprestimosAtivos.findIndex((item) => item.id === idClicado);
  if (indice === -1) return;

  const [emprestimoDevolvido] = emprestimosAtivos.splice(indice, 1); // remove da lista de ativos
  emprestimoDevolvido.dataDevolucao = obterDataHojeISO();
  historicoDevolucoes.unshift(emprestimoDevolvido); // adiciona no início do histórico

  // O livro volta a ficar disponível para novos empréstimos.
  const livro = listaDeLivros.find((item) => item.id === emprestimoDevolvido.livroId);
  livro.status = "disponivel";

  renderizarEmprestimosAtivos();
  renderizarHistorico();
  popularSelectDeLivros();

  mostrarAlerta("sucesso", `Devolução de "${emprestimoDevolvido.livroTitulo}" registrada.`);
});

// ---------- Inicialização da página ----------

document.getElementById("data-prevista").min = obterDataHojeISO();
popularSelectDeLivros();
renderizarEmprestimosAtivos();
renderizarHistorico();
