const { MercadoPagoConfig, PreApproval } = require("mercadopago");

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preapproval = new PreApproval(client);

async function criarAssinatura(email) {
  const resposta = await preapproval.create({
    body: {
      reason: "Assinatura mensal - Painel de Sinais",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(process.env.PRECO_MENSAL || 69.9),
        currency_id: "BRL",
      },
      payer_email: email,
      back_url: `${process.env.APP_URL}/assinatura-confirmada`,
      status: "pending",
    },
  });
  return { linkPagamento: resposta.init_point, preapprovalId: resposta.id };
}

async function consultarAssinatura(preapprovalId) {
  return preapproval.get({ id: preapprovalId });
}

module.exports = { criarAssinatura, consultarAssinatura };
