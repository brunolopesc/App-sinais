const express = require("express");
const router = express.Router();
const db = require("../db");
const { gerarSenhaAleatoria, hashSenha, gerarToken, verificarToken, apenasAdmin, conferirSenha } = require("../auth");
const { criarAssinatura } = require("../mercadopago");

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const okEmail = email === process.env.ADMIN_EMAIL;
  const okSenha = senha === process.env.ADMIN_SENHA_INICIAL;
  if (!okEmail || !okSenha) return res.status(401).json({ erro: "Credenciais inválidas" });
  const token = gerarToken({ tipo: "admin", email });
  res.json({ token });
});

router.use(verificarToken, apenasAdmin);

router.get("/clientes", (req, res) => {
  const clientes = db.prepare("SELECT id, email, status, teste_expira_em, criado_em FROM clientes ORDER BY id DESC").all();
  res.json(clientes);
});

router.post("/clientes", async (req, res) => {
  const { email, modo } = req.body;
  if (!email || !email.includes("@")) return res.status(400).json({ erro: "Email inválido" });

  const senha = gerarSenhaAleatoria();
  const hash = await hashSenha(senha);
  const testeExpira = modo === "teste" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

  try {
    const info = db.prepare(
      `INSERT INTO clientes (email, senha_hash, status, teste_expira_em) VALUES (?, ?, ?, ?)`
    ).run(email, hash, modo === "ativo" ? "ativo" : "teste", testeExpira);

    let linkPagamento = null;
    if (modo === "ativo") {
      const assinatura = await criarAssinatura(email);
      linkPagamento = assinatura.linkPagamento;
      db.prepare("UPDATE clientes SET mp_preapproval_id = ? WHERE id = ?").run(assinatura.preapprovalId, info.lastInsertRowid);
    }

    res.json({ email, senha_temporaria: senha, linkPagamento });
  } catch (e) {
    res.status(400).json({ erro: "Email já cadastrado" });
  }
});

router.patch("/clientes/:id/status", (req, res) => {
  const { status } = req.body;
  db.prepare("UPDATE clientes SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
