const express = require("express");
const router = express.Router();
const db = require("../db");
const { consultarAssinatura } = require("../mercadopago");

// Configure esta URL (SEU_DOMINIO/webhook/mercadopago) no painel do Mercado Pago
// em Suas integrações > Webhooks. É isso que liga/desliga o acesso do cliente sozinho.
router.post("/mercadopago", async (req, res) => {
  const { type, data } = req.body;
  res.sendStatus(200); // responde rápido, processa depois

  if (type !== "preapproval") return;

  try {
    const assinatura = await consultarAssinatura(data.id);
    const cliente = db.prepare("SELECT * FROM clientes WHERE mp_preapproval_id = ?").get(data.id);
    if (!cliente) return;

    let novoStatus = cliente.status;
    if (assinatura.status === "authorized") novoStatus = "ativo";
    else if (["cancelled", "paused"].includes(assinatura.status)) novoStatus = "bloqueado";

    db.prepare("UPDATE clientes SET status = ? WHERE id = ?").run(novoStatus, cliente.id);
    db.prepare("INSERT INTO eventos_pagamento (cliente_id, tipo, payload) VALUES (?, ?, ?)")
      .run(cliente.id, assinatura.status, JSON.stringify(assinatura));
  } catch (e) {
    console.error("Erro processando webhook Mercado Pago:", e.message);
  }
});

module.exports = router;
