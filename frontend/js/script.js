// ==========================================================
// Aula 1 — primeiro contato com JavaScript no projeto
//
// Por enquanto o script faz só uma coisa simples: escreve o
// ano atual no rodapé automaticamente, para não precisarmos
// editar o HTML todo ano.
// ==========================================================

// 1. Pegamos o elemento do HTML pelo id "ano-atual"
const elementoAno = document.getElementById("ano-atual");

// 2. Pedimos ao navegador a data de hoje
const dataDeHoje = new Date();

// 3. Extraímos só o ano e colocamos dentro do elemento
elementoAno.textContent = dataDeHoje.getFullYear();

// Dica: abra o Console do navegador (F12 → aba "Console")
// e digite "dataDeHoje" para ver o objeto de data completo.

// ==========================================================
// Aula 11 — o link "Entrar" do menu passa a refletir se existe
// alguém logado. script.js é carregado em TODAS as páginas
// (depois de js/auth.js), então é o lugar certo para essa
// lógica que é igual em qualquer tela.
//
// Ajuste — o item só aparece quando TEM alguém logado (virando
// "Sair (nome)"). Deslogado, ele ficava com o texto "Entrar"
// apontando para "index.html" — exatamente o mesmo destino do
// link "Início", já presente no menu. Em vez de mostrar dois
// links iguais, escondemos o item inteiro nesse caso (em vez de
// removê-lo do HTML, porque ele volta a aparecer como "Sair"
// assim que alguém loga).
// ==========================================================

async function atualizarLinkConta() {
  const linkConta = document.getElementById("link-conta");
  if (!linkConta) return; // segurança, caso alguma página não tenha o link

  const itemConta = linkConta.parentElement;
  const sessao = await obterSessaoAtual();

  if (!sessao) {
    itemConta.hidden = true;
    linkConta.onclick = null;
    return;
  }

  itemConta.hidden = false;
  linkConta.textContent = `Sair (${sessao.nome})`;
  linkConta.href = "#";
  linkConta.onclick = (evento) => {
    evento.preventDefault();
    encerrarSessao();
  };
}

atualizarLinkConta();
