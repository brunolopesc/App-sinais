const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "dados.sqlite"));

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    precisa_trocar_senha INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'teste', -- 'teste' | 'ativo' | 'bloqueado'
    teste_expira_em TEXT,
    mp_preapproval_id TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS eventos_pagamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    tipo TEXT,
    payload TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
