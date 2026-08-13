const { MercadoPagoConfig, PreApproval } = require("mercadopago");

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preapproval = new PreApproval(client);

// Cria uma assinatura recorrente mensal para o cliente. O Mercado Pago gera
// automaticamente a cobrança via Pix ou cartão conforme o cliente escolher na tela de pagamento.
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
  // resposta.init_point é o link de pagamento que você manda pro cliente
  return { linkPagamento: resposta.init_point, preapprovalId: resposta.id };
}

// Chamado pelo webhook do Mercado Pago quando o status de uma assinatura muda
// (pagamento aprovado, cancelado, atrasado etc). Isso é o que liga/desliga o acesso sozinho.
async function consultarAssinatura(preapprovalId) {
  return preapproval.get({ id: preapprovalId });
}

module.exports = { criarAssinatura, consultarAssinatura };
