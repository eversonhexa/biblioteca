# Guia de instalação — Laboratório de Informática

## Para quem é este guia

Este documento explica como levar o projeto para os **outros computadores do laboratório**, de forma que **cada computador rode sua própria cópia completa e independente** do sistema — cada aluno com seu próprio servidor Node.js e seu próprio banco MySQL rodando localmente, podendo mexer, testar e até "quebrar" o próprio ambiente sem afetar os colegas.

A cópia do código para cada máquina é feita **diretamente** (pen drive ou pasta compartilhada da rede) — sem usar Git nessa etapa, já que o objetivo aqui é só levar o código, não ensinar controle de versão.

Está dividido em duas partes: o que **você (professor) prepara uma vez**, antes de sair copiando, e o **roteiro que se repete em cada computador** — esse segundo pedaço pode ser impresso ou projetado para os alunos seguirem sozinhos, acompanhados por você.

## Parte 1 — Preparando a pasta para distribuir (uma vez, no seu computador)

Antes de copiar `C:\wrk\biblioteca` para um pen drive, **três coisas não devem ir junto**:

1. **`backend/node_modules/`** — é a pasta (grande, e reconstruída automaticamente por `npm install`) onde ficam as bibliotecas baixadas. Nunca se copia essa pasta entre computadores: cada máquina deve gerar a sua própria, com `npm install` (parte 2). Copiar `node_modules/` de um computador para outro é uma fonte comum de erros difíceis de diagnosticar.
2. **`backend/.env`** — tem a senha do SEU MySQL. Cada computador do laboratório provavelmente tem sua própria senha de root configurada, então cada aluno vai criar o próprio `.env` a partir do `.env.example` (que esse sim, pode e deve ir junto).
3. **A pasta `.git/`**, se existir na raiz do projeto — não é necessária para esta distribuição (você optou por cópia direta, não por `git clone`), e evita que os alunos acabem mexendo sem querer no repositório GitHub que você configurou.

Também é um bom momento para **dar uma olhada geral na pasta** e conferir se não há nada pessoal ou fora do escopo do curso que você não queira levar para os alunos (rascunhos, anotações soltas, pastas de teste) — no meio do caminho deste projeto chegamos a notar algumas pastas/arquivos criados à parte (como `teste.html` ou pastas de "aula 02" a "aula 05"); vale conferir se ainda existem e se devem ir junto.

### Como empacotar

No Windows, a forma mais simples:

1. Abra a pasta `C:\wrk\biblioteca` no Explorador de Arquivos.
2. Se existir, **delete (ou mova para fora)** temporariamente `backend/node_modules/`, `backend/.env` e `.git/` — ou, melhor ainda, copie o projeto para uma pasta temporária primeiro e exclua essas três coisas só na cópia, mantendo o seu ambiente de trabalho intacto.
3. Clique com o botão direito na pasta `biblioteca` → **Enviar para → Pasta compactada (zipada)**. Isso gera um `biblioteca.zip` bem mais leve (sem `node_modules`, geralmente entre poucos MB) e fácil de copiar para o pen drive ou subir numa pasta de rede compartilhada.

## Parte 2 — Roteiro para cada computador do laboratório

Repita isto em cada máquina. É essencialmente o mesmo processo das Aulas 6, 7 e 10 (Node.js, `.env`, `schema.sql`) — só que agora rodando pela primeira vez num computador novo, o que é uma ótima forma de fixar por que cada uma dessas etapas existe.

### 2.1 — Confira os pré-requisitos da máquina

Abra o terminal (PowerPoint/PowerShell ou o terminal integrado do VS Code) e rode:

```
node -v
npm -v
mysql --version
```

- Se `node -v` e `npm -v` não forem reconhecidos, o **Node.js** precisa ser instalado nessa máquina antes de continuar (baixe em nodejs.org — a versão "LTS"). VS Code e MySQL você já confirmou que estão prontos em todas as máquinas do laboratório.
- Confirme também que o **serviço do MySQL está rodando** (no Windows, procure "Serviços" no menu Iniciar e veja se "MySQL80" — ou nome parecido — está com status "Em execução").

### 2.2 — Copie e extraia o projeto

1. Copie `biblioteca.zip` do pen drive (ou da pasta de rede) para dentro de `C:\wrk\` na máquina do laboratório (crie a pasta `C:\wrk` se não existir).
2. Extraia o zip ali — o resultado deve ser `C:\wrk\biblioteca\`, com as pastas `frontend/`, `backend/` e `docs/` dentro.
3. Abra essa pasta no VS Code (`File > Open Folder... > C:\wrk\biblioteca`).

### 2.3 — Crie o banco de dados

Com o MySQL rodando, execute o script `backend/sql/schema.sql`:

- **Pelo MySQL Workbench:** abra o arquivo (`File > Open SQL Script`) e clique no raio (⚡) para rodar tudo.
- **Pela linha de comando** (dentro do terminal do VS Code): `mysql -u root -p < backend/sql/schema.sql`

Isso cria o banco `biblioteca_escolar`, as quatro tabelas (`livros`, `alunos`, `emprestimos`, `usuarios`) e os dados de exemplo — do zero, nessa máquina.

### 2.4 — Configure o `.env`

Dentro de `backend/`, copie `.env.example` para um novo arquivo chamado `.env` e preencha:

```
DB_PASSWORD=<a senha do MySQL DESTE computador>
SESSION_SECRET=<qualquer texto longo — pode ser diferente em cada máquina>
```

O resto (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, `PORT`) normalmente pode ficar como está no exemplo.

### 2.5 — Instale as dependências

Ainda dentro de `backend/`, no terminal:

```
npm install
```

Isso lê `package.json` e baixa (para dentro de um novo `node_modules/`, gerado aqui mesmo, nesta máquina) tudo que o projeto precisa: Express, MySQL2, dotenv, cors, express-session, nodemon.

### 2.6 — Crie os usuários de teste

Ainda em `backend/`:

```
node scripts/criar-usuarios.js
```

Cria (ou reseta a senha de) os dois usuários de teste: `bibliotecaria` / `biblioteca123` e `aluno1` / `aluno123`.

### 2.7 — Rode o servidor

```
npm run dev
```

O terminal deve mostrar `Servidor rodando em http://localhost:3000`. Se aparecer algum erro aqui, veja a seção "Erros comuns" abaixo antes de continuar.

### 2.8 — Acesse e confira

Abra o navegador em `http://localhost:3000/` — **não** pelo Live Server, lembrando do que vimos na Aula 11 (sessão por cookie exige mesma origem).

Checklist rápido para confirmar que está tudo certo nesta máquina:

- [ ] A tela inicial carrega, com o menu completo (Início, Acervo, Empréstimos, Cadastrar Livro, Cadastrar Aluno, Entrar).
- [ ] **Acervo** mostra os 10 livros de exemplo.
- [ ] Login com `bibliotecaria` / `biblioteca123` funciona, e o menu passa a mostrar "Sair (Ana...)".
- [ ] Com login feito, **Cadastrar Livro** e **Cadastrar Aluno** mostram os formulários (em vez da mensagem pedindo login).
- [ ] Um livro cadastrado nesta tela aparece também em **Acervo**.

## Erros comuns e como resolver

- **`Error: Cannot find module 'express'` (ou outro pacote)** — o `npm install` (passo 2.5) não rodou, ou rodou na pasta errada. Confirme que está dentro de `backend/` ao rodar `npm install`.
- **`Table 'biblioteca_escolar.usuarios' doesn't exist`** (ou tabela parecida) — o `schema.sql` (passo 2.3) ainda não foi rodado, ou foi rodado antes de a tabela existir no script. Rode `schema.sql` de novo — é seguro, usa `CREATE TABLE IF NOT EXISTS`.
- **`Access denied for user 'root'@'localhost'`** — a senha em `backend/.env` (`DB_PASSWORD`) não confere com a senha real do MySQL dessa máquina. Confira com quem instalou o MySQL do laboratório.
- **`Error: listen EADDRINUSE: address already in use :::3000`** — já existe algo rodando na porta 3000 nessa máquina (pode ser uma instância anterior do próprio projeto, esquecida rodando). Feche o terminal antigo, ou procure o processo (`netstat -ano | findstr :3000` no Windows, depois `taskkill /PID <número> /F`).
- **Página abre, mas sem nenhum estilo (sem CSS) ou dando vários 404 no console** — sinal de que a pasta foi extraída de forma incompleta, ou que o navegador está acessando um caminho errado (ex.: abrindo o `index.html` direto do disco, como arquivo, em vez de `http://localhost:3000/`).
- **`node_modules` foi copiado sem querer, e nada funciona** — apague a pasta `backend/node_modules/` inteira e rode `npm install` de novo, nessa máquina.

## Depois: atualizando os laboratórios quando o projeto mudar

Como a distribuição aqui é por cópia direta (não por `git clone`), quando você adicionar algo novo ao projeto no seu computador (uma aula nova, um ajuste), vai precisar **levar de novo** para os laboratórios. Duas formas:

- **Mais simples:** repetir a Parte 1 (gerar um novo `.zip`, sem `node_modules`/`.env`/`.git`) e, em cada máquina, apagar a pasta `biblioteca` antiga e extrair a nova por cima — refazendo só os passos 2.4 (`.env`, que cada máquina já tinha) e 2.5 (`npm install`, caso alguma dependência nova tenha sido adicionada ao `package.json`).
- **Mais trabalhosa, mas granular:** copiar só os arquivos que mudaram, por cima da pasta existente em cada laboratório — funciona, mas exige você saber exatamente o que mudou.

Se algum dia o laboratório tiver acesso à internet e você quiser trocar para `git clone`/`git pull` (mais prático a longo prazo, principalmente para atualizações), é só voltar a este projeto e pedir — o repositório já está pronto em `https://github.com/eversonhexa/biblioteca.git`.
