const express = require("express");
const router = express.Router();
const db = require("../db");
const { hashSenha, conferirSenha, gerarToken, verificarToken } = require("../auth");

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const cliente = db.prepare("SELECT * FROM clientes WHERE email = ?").get(email);
  if (!cliente) return res.status(401).json({ erro: "Email ou senha inválidos" });

  const senhaOk = await conferirSenha(senha, cliente.senha_hash);
  if (!senhaOk) return res.status(401).json({ erro: "Email ou senha inválidos" });

  // Teste expirado vira bloqueado automaticamente
  if (cliente.status === "teste" && cliente.teste_expira_em && new Date(cliente.teste_expira_em) < new Date()) {
    db.prepare("UPDATE clientes SET status = 'bloqueado' WHERE id = ?").run(cliente.id);
    return res.status(403).json({ erro: "Seu período de teste de 24h acabou. Assine para continuar." });
  }

  if (cliente.status === "bloqueado") {
    return res.status(403).json({ erro: "Acesso bloqueado por falta de pagamento." });
  }

  const token = gerarToken({ tipo: "cliente", id: cliente.id, email: cliente.email });
  res.json({ token, precisaTrocarSenha: !!cliente.precisa_trocar_senha, status: cliente.status });
});

router.post("/trocar-senha", verificarToken, async (req, res) => {
  if (req.usuario.tipo !== "cliente") return res.status(403).json({ erro: "Não autorizado" });
  const { novaSenha } = req.body;
  if (!novaSenha || novaSenha.length < 6) return res.status(400).json({ erro: "Senha deve ter 6+ caracteres" });
  const hash = await hashSenha(novaSenha);
  db.prepare("UPDATE clientes SET senha_hash = ?, precisa_trocar_senha = 0 WHERE id = ?").run(hash, req.usuario.id);
  res.json({ ok: true });
});

module.exports = router;
