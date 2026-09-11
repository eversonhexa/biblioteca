# Aula 5 — Tela de login (simulada)

## Objetivo

Criar a tela `login.html`, com um formulário de usuário e senha, um recurso de "mostrar senha" e uma validação **simulada** das credenciais — e entender claramente **por que** essa simulação não pode existir em um sistema real.

Com esta aula, fechamos o ciclo das 5 telas principais do frontend. A partir da próxima aula começamos o backend.

## Pré-requisitos

- Ter concluído as **Aulas 1 a 4**.

## 1. Arquivos novos desta aula

```
frontend/
├── login.html                 → nova página
└── js/
    ├── dados-usuarios.js        → usuários de teste (⚠️ ver seção 2)
    └── login.js                 → validação e lógica do login
```

O `style.css` ganhou a seção nº 9 (caixa de aviso, checkbox "mostrar senha") e uma variação `.conteudo--estreita`, usada para o `<main>` do login não ficar esticado até a largura das outras telas.

## 2. ⚠️ O ponto mais importante desta aula: por que isso é inseguro

Abra `js/dados-usuarios.js`. Nele, temos uma lista com usuário e **senha em texto puro**:

```js
const usuariosDeTeste = [
  { usuario: "bibliotecaria", senha: "biblioteca123", nome: "Ana (Bibliotecária)" },
  { usuario: "aluno1", senha: "aluno123", nome: "Carlos (Aluno)" },
];
```

Isso **nunca** pode existir em um sistema de verdade, por um motivo simples: **todo o código que roda no navegador pode ser lido por qualquer pessoa** — basta apertar F12 e olhar a aba "Sources", ou até só dar "Ver código-fonte da página". Não existe "esconder" nada no frontend.

Em um sistema real:

1. O navegador envia usuário e senha para o **servidor** (que vamos construir com Node.js, a partir da próxima aula).
2. O servidor busca, no banco de dados, a senha **criptografada** (um "hash", geralmente gerado com uma função como `bcrypt`) daquele usuário — a senha original nunca fica guardada em lugar nenhum, nem no servidor.
3. O servidor aplica a mesma criptografia na senha recebida e compara os dois hashes. Se baterem, o login é aceito.
4. Em nenhum momento a lista de senhas (nem os hashes) trafega para o navegador.

Fizemos essa simulação só para **praticar a construção do formulário** — os campos, a validação, o feedback visual. A lógica de comparação (`usuariosDeTeste.find(...)`) vai ser substituída, lá na frente, por uma chamada à API do nosso backend.

> Fica o combinado com a turma: este é o tipo de decisão que separa um sistema amador de um profissional — e é exatamente esse tipo de cuidado que vocês vão aprofundar nas aulas de Segurança de Software.

## 3. Mostrar/ocultar senha

```js
checkboxMostrarSenha.addEventListener("change", () => {
  campoSenha.type = checkboxMostrarSenha.checked ? "text" : "password";
});
```

O campo de senha começa como `type="password"` (o navegador troca os caracteres por bolinhas automaticamente). Ao marcar o checkbox "Mostrar senha", trocamos o `type` do campo para `"text"` em tempo real — é só isso, o próprio navegador já sabe exibir ou esconder o conteúdo dependendo do `type`.

## 4. A validação e o login em si

O padrão é o mesmo das Aulas 3 e 4 (`limparErros`, `mostrarErroDoCampo`, `mostrarAlerta`, `evento.preventDefault()`), com uma diferença de segurança pequena, mas importante:

```js
if (!usuarioEncontrado) {
  mostrarAlerta("erro", "Usuário ou senha inválidos.");
  return;
}
```

Note que a mensagem de erro **não diz** se o problema foi o usuário (não existe) ou a senha (está errada) — ela é sempre a mesma frase genérica. Isso é proposital: se disséssemos "usuário não encontrado" versus "senha incorreta", alguém tentando adivinhar credenciais alheias saberia, por eliminação, quais usuários existem no sistema. É um pequeno detalhe, mas típico de como se pensa segurança na prática.

## 5. Como testar

1. Vá em "Entrar" no menu.
2. Tente enviar o formulário vazio — os dois campos devem mostrar erro.
3. Digite um usuário ou senha errados (ex.: `teste` / `123`) — deve aparecer "Usuário ou senha inválidos."
4. Entre com `bibliotecaria` / `biblioteca123` — deve aparecer a mensagem de boas-vindas com o nome da Ana.
5. Marque "Mostrar senha" e confirme que os caracteres digitados ficam visíveis.

## 6. Desafios para praticar

1. Adicionar mais um usuário de teste em `dados-usuarios.js` e testar o login com ele.
2. Contar as tentativas de login erradas e, depois de 3 tentativas seguidas, desabilitar o botão "Entrar" por alguns segundos (proteção simples contra tentativa e erro repetida — um "gostinho" de rate limiting).
3. Pesquisar (fora do código) o que é **hash** e o que é **salt** em criptografia de senhas, e trazer para a próxima aula presencial uma explicação com suas palavras.

## Fim da parte 1 — Frontend

Com esta aula, fechamos as 5 telas principais do frontend: Início, Acervo, Cadastro de Livros, Empréstimos e Login. Até aqui, tudo funciona com dados simulados, vivendo só na memória do navegador.

## Próxima aula

**Aula 6 — Início do backend com Node.js**: vamos sair do frontend pela primeira vez e criar um servidor com Node.js, entendendo o que é uma API, o que são rotas HTTP, e como o frontend vai, no futuro, conversar com esse servidor no lugar dos arrays fixos que usamos até aqui.
