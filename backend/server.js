// ==========================================================
// Aula 6 — primeiro servidor com Node.js + Express
// Aula 7 — /api/livros passou a consultar o MySQL
// Aula 8 — liberado o CORS
// Aula 9 — rotas de alunos e empréstimos, com regras de negócio
// Aula 10 — login de verdade, rotas organizadas em routes/,
//           e o próprio Express passou a servir o frontend
// Aula 11 — sessão de verdade (express-session): login passou
//           a "durar" entre páginas, e rotas sensíveis passaram
//           a exigir login também no servidor (não só na tela)
// ==========================================================

const path = require("path");
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const cors = require("cors");

const rotasLivros = require("./routes/livros");
const rotasAlunos = require("./routes/alunos");
const rotasEmprestimos = require("./routes/emprestimos");
const rotasAuth = require("./routes/auth");

const app = express();
const PORTA = process.env.PORT || 3000;

// cors() com credenciais desligadas funciona bem quando frontend
// e backend são servidos pela mesma origem (seção 6, Aula 10) —
// que é justamente o que sessão por cookie exige (veja o material
// da Aula 11 para entender por quê).
app.use(cors());
app.use(express.json());

// A sessão precisa vir ANTES das rotas que a utilizam, para que
// "req.session" já exista quando elas forem executadas.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "segredo-de-desenvolvimento-troque-no-env",
    resave: false, // não regrava a sessão no armazenamento se nada mudou
    saveUninitialized: false, // não cria sessão para quem nunca logou
    cookie: {
      maxAge: 1000 * 60 * 60 * 4, // 4 horas
      // "secure: true" exigiria HTTPS — deixamos "false" porque,
      // no cenário desta aula (rede da escola, sem HTTPS), o
      // cookie precisa funcionar também em HTTP simples.
      secure: false,
    },
  })
);

// Faz o Express servir os arquivos do frontend diretamente
// (HTML, CSS, JS, imagens) — o mesmo servidor que expõe a API
// agora também entrega as páginas. Na prática, a partir de
// agora dá para abrir http://localhost:3000/ direto, SEM
// precisar do Live Server, e ver o site completo funcionando.
// path.join(__dirname, "..", "frontend") monta o caminho
// absoluto até a pasta frontend/, a partir de onde quer que o
// projeto esteja no disco de cada pessoa.
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Cada "router" cuida só do seu próprio grupo de rotas — aqui
// definimos o PREFIXO da URL de cada um. Dentro dos arquivos em
// routes/, as rotas são escritas sem esse prefixo (ex.: "/",
// "/:id/devolucao").
app.use("/api/livros", rotasLivros);
app.use("/api/alunos", rotasAlunos);
app.use("/api/emprestimos", rotasEmprestimos);
app.use("/api", rotasAuth); // define POST /api/login

// Rota de "saúde" (health check), continua aqui por ser bem
// genérica — não pertence a nenhum recurso específico.
const pool = require("./db");
app.get("/api/status", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", banco: "conectado", horario: new Date().toISOString() });
  } catch (erro) {
    console.error("Falha ao conectar no banco:", erro.message);
    res.status(500).json({ status: "erro", banco: "não foi possível conectar" });
  }
});

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
