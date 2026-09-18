// ==========================================================
// Aula 11 — helper de autenticação, compartilhado por várias
// páginas (por isso fica em um arquivo próprio, carregado
// ANTES de script.js, cadastro.js e emprestimos.js no HTML).
//
// A partir desta aula, todas as chamadas à API usam URL
// RELATIVA (ex.: "/api/sessao", em vez de
// "http://localhost:3000/api/sessao"). Isso só funciona quando
// a página é aberta a partir do próprio backend
// (http://localhost:3000/... — veja a seção 6 da Aula 10), e é
// justamente o que sessão por cookie exige: o navegador só
// envia o cookie de sessão em pedidos para a MESMA origem que
// abriu a página.
// ==========================================================

// Pergunta ao servidor "existe alguém logado agora, neste
// navegador?". Devolve o objeto { id, usuario, nome } se sim,
// ou null se não houver sessão válida.
async function obterSessaoAtual() {
  try {
    const resposta = await fetch("/api/sessao");
    if (!resposta.ok) {
      return null;
    }
    return await resposta.json();
  } catch (erro) {
    console.error("Falha ao consultar a sessão:", erro);
    return null;
  }
}

// Encerra a sessão no servidor (apaga o cookie) e recarrega a
// página atual, para que toda a tela reflita o estado "deslogado".
async function encerrarSessao() {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (erro) {
    console.error("Falha ao encerrar sessão:", erro);
  } finally {
    window.location.reload();
  }
}
