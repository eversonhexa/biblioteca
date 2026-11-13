-- ==========================================================
-- Aula 7 — modelagem do banco de dados
--
-- Cria o banco "biblioteca_escolar" e as três tabelas que
-- representam o domínio do sistema, já pensando nas próximas
-- aulas: por enquanto o servidor só vai CONSULTAR a tabela
-- "livros", mas modelamos "alunos" e "emprestimos" agora,
-- com seus relacionamentos, para não termos que redesenhar a
-- estrutura mais adiante.
--
-- Como executar:
--   - MySQL Workbench: abra este arquivo (File > Open SQL Script)
--     e clique no raio (⚡) para executar tudo.
--   - Linha de comando: mysql -u root -p < sql/schema.sql
-- ==========================================================

CREATE DATABASE IF NOT EXISTS biblioteca_escolar
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE biblioteca_escolar;

-- ----------------------------------------------------------
-- Tabela: livros
-- Equivalente ao array "listaDeLivros" que usávamos até aqui.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS livros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  autor VARCHAR(120) NOT NULL,
  categoria VARCHAR(60) NOT NULL,
  ano INT NOT NULL,
  -- Ajuste (depois da Aula 11) — ISBN: o "RG" de uma edição de
  -- livro, sempre com 13 dígitos. É opcional (NULL) porque o
  -- padrão ISBN só existe desde ~1970 — livros mais antigos,
  -- como os cadastrados logo abaixo, nunca tiveram um. UNIQUE
  -- porque dois livros não podem ter o mesmo ISBN — mas várias
  -- linhas ainda podem ficar com isbn NULL ao mesmo tempo (o
  -- MySQL não considera NULL igual a NULL para fins de UNIQUE).
  isbn VARCHAR(13) NULL UNIQUE,
  -- Ajuste (cadastro de livros) — editora: opcional, porque nem
  -- todo livro antigo do acervo tem essa informação registrada.
  editora VARCHAR(120) NULL,
  status ENUM('disponivel', 'emprestado') NOT NULL DEFAULT 'disponivel'
);

-- Se você já tinha rodado este script ANTES desta atualização
-- (ou seja, já existe uma tabela "livros" sem a coluna "isbn"),
-- rode só o comando abaixo, uma vez, para adicionar a coluna que
-- falta (remova o "--" do início da linha antes de executar):
-- ALTER TABLE livros ADD COLUMN isbn VARCHAR(13) NULL UNIQUE AFTER ano;

-- O mesmo vale para quem já tinha a coluna "isbn" mas ainda não
-- tem "editora" (remova o "--" do início da linha antes de executar):
-- ALTER TABLE livros ADD COLUMN editora VARCHAR(120) NULL AFTER isbn;

-- ----------------------------------------------------------
-- Tabela: alunos
-- Ainda não é usada pelo servidor nesta aula — vem nas
-- Aulas 8/9, quando ligarmos a tela de Empréstimos ao banco.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  turma VARCHAR(30)
);

-- ----------------------------------------------------------
-- Tabela: emprestimos
-- Uma linha por empréstimo. "livro_id" e "aluno_id" são
-- CHAVES ESTRANGEIRAS (FOREIGN KEY): apontam para o "id" de
-- um livro e de um aluno já existentes, garantindo que não dá
-- para registrar um empréstimo de um livro ou aluno que não
-- existe na base. "data_devolucao" começa vazia (NULL) e só
-- é preenchida quando o livro é devolvido.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS emprestimos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  livro_id INT NOT NULL,
  aluno_id INT NOT NULL,
  data_emprestimo DATE NOT NULL,
  data_prevista DATE NOT NULL,
  data_devolucao DATE NULL,
  FOREIGN KEY (livro_id) REFERENCES livros(id),
  FOREIGN KEY (aluno_id) REFERENCES alunos(id)
);

-- ----------------------------------------------------------
-- Tabela: usuarios
-- Aula 10 — login de verdade. "senha_hash" nunca guarda a
-- senha em texto puro, só o resultado de um algoritmo de hash
-- (veja backend/utils/senha.js) — nem nós, olhando o banco,
-- conseguimos descobrir a senha original a partir daqui.
-- Os usuários são criados por um script (scripts/criar-usuarios.js),
-- não por INSERT direto, porque o hash precisa ser calculado
-- em JavaScript, não escrito à mão.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(60) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(120) NOT NULL
);

-- ----------------------------------------------------------
-- Dados de exemplo: os mesmos 10 livros que já vínhamos
-- usando em backend/dados-livros.js.
-- ----------------------------------------------------------
INSERT INTO livros (titulo, autor, categoria, ano, status) VALUES
('Dom Casmurro', 'Machado de Assis', 'Romance', 1899, 'disponivel'),
('O Cortiço', 'Aluísio Azevedo', 'Romance', 1890, 'emprestado'),
('Vidas Secas', 'Graciliano Ramos', 'Romance', 1938, 'disponivel'),
('Capitães da Areia', 'Jorge Amado', 'Romance', 1937, 'disponivel'),
('Iracema', 'José de Alencar', 'Romance', 1865, 'emprestado'),
('Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'Romance', 1881, 'disponivel'),
('O Alienista', 'Machado de Assis', 'Conto', 1882, 'disponivel'),
('Grande Sertão: Veredas', 'Guimarães Rosa', 'Romance', 1956, 'disponivel'),
('Auto da Compadecida', 'Ariano Suassuna', 'Teatro', 1955, 'emprestado'),
('Quincas Borba', 'Machado de Assis', 'Romance', 1891, 'disponivel');

-- Alguns alunos de exemplo, já para os desafios desta aula.
INSERT INTO alunos (nome, turma) VALUES
('Carlos Eduardo', '9º A'),
('Beatriz Lima', '9º B'),
('Rafael Souza', '8º A');
