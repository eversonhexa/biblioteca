// ==========================================================
// Evolução 1 — nova tela: "Livros em atraso".
//
// Reaproveita a mesma rota GET /api/emprestimos (sem parâmetro
// de status) que já devolve os empréstimos ativos ordenados por
// data_prevista ASC — ou seja, o próprio banco já entrega a lista
// na ordem certa: primeiro quem está devendo o livro há mais
// tempo (ou vai vencer primeiro), por último quem ainda tem mais
// prazo. Esta tela só precisa desenhar a tabela e destacar quem
// já está atrasado.
// ==========================================================

const URL_API_EMPRESTIMOS = "/api/emprestimos";

const mensagemLoginNecessario = document.getElementById("mensagem-login-necessario");
const conteudoProtegido = document.getElementById("conteudo-protegido");
const campoAlerta = document.getElementById("alerta");
const mensagemCarregando = document.getElementById("mensagem-carregando");
const corpoTabela = document.getElementById("tabela-atrasados-corpo");
const mensagemSemEmprestimos = document.getElementById("mensagem-sem-emprestimos");

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

// Quantos dias se passaram desde a data prevista (positivo =
// atrasado há N dias; zero ou negativo = ainda em dia).
function diasDeAtraso(dataPrevistaISO) {
  const umDiaEmMs = 1000 * 60 * 60 * 24;
  const hoje = new Date(`${obterDataHojeISO()}T00:00:00`);
  const prevista = new Date(`${dataPrevistaISO}T00:00:00`);
  return Math.round((hoje - prevista) / umDiaEmMs);
}

function mostrarAlerta(tipo, mensagem) {
  campoAlerta.textContent = mensagem;
  campoAlerta.className = `alerta alerta--${tipo}`;
  campoAlerta.hidden = false;
}

function formatarCelulaSituacao(dataPrevistaISO) {
  const atraso = diasDeAtraso(dataPrevistaISO);

  if (atraso <= 0) {
    return `<span class="badge badge--disponivel">Em dia</span>`;
  }
  const dias = atraso === 1 ? "1 dia" : `${atraso} dias`;
  return `<span class="badge badge--emprestado">Atrasado (${dias})</span>`;
}

function renderizarEmprestimos(emprestimos) {
  corpoTabela.innerHTML = "";

  emprestimos.forEach((emprestimo) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${emprestimo.livroTitulo}</td>
      <td>${emprestimo.livroIsbn || "—"}</td>
      <td>${emprestimo.alunoNome}</td>
      <td>${emprestimo.alunoTurma || "—"}</td>
      <td>${formatarDataBR(emprestimo.dataEmprestimo)}</td>
      <td>${formatarDataBR(emprestimo.dataPrevista)}</td>
      <td>${formatarCelulaSituacao(emprestimo.dataPrevista)}</td>
      <td><button type="button" class="botao botao--secundario" data-id="${emprestimo.id}">Registrar devolução</button></td>
    `;
    corpoTabela.appendChild(linha);
  });

  mensagemSemEmprestimos.hidden = emprestimos.length > 0;
}

async function carregarEmprestimosAtivos() {
  const resposta = await fetch(URL_API_EMPRESTIMOS);
  if (!resposta.ok) throw new Error("Falha ao buscar empréstimos ativos.");
  const emprestimos = await resposta.json();
  renderizarEmprestimos(emprestimos);
}

// Delegação de evento: um único listener cobre todos os botões
// "Registrar devolução", mesmo os recriados a cada renderização.
corpoTabela.addEventListener("click", async (evento) => {
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
        await verificarAcessoEInicializar();
        return;
      }
      mostrarAlerta("erro", corpo.erro || "Não foi possível registrar a devolução.");
      return;
    }

    mostrarAlerta("sucesso", "Devolução registrada com sucesso.");
    await carregarEmprestimosAtivos();
  } catch (erro) {
    console.error("Falha de rede ao registrar devolução:", erro);
    mostrarAlerta("erro", "Não foi possível falar com o servidor. Verifique se o backend está rodando.");
  }
});

// ---------- Inicialização da página ----------

async function verificarAcessoEInicializar() {
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    mensagemLoginNecessario.hidden = false;
    conteudoProtegido.hidden = true;
    return;
  }

  mensagemLoginNecessario.hidden = true;
  conteudoProtegido.hidden = false;
  mensagemCarregando.hidden = false;

  try {
    await carregarEmprestimosAtivos();
  } catch (erro) {
    console.error("Falha ao carregar os empréstimos:", erro);
    mostrarAlerta(
      "erro",
      "Não foi possível carregar os dados. Verifique se o backend está rodando (npm run dev, na pasta backend) e recarregue a página."
    );
  } finally {
    mensagemCarregando.hidden = true;
  }
}

verificarAcessoEInicializar();
