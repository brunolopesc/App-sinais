# Painel de Sinais — guia de publicação

Este pacote é o backend completo + a base do PWA. Os painéis visuais (tela de sinais e
tela do gestor) que já te mostrei em React entram dentro da pasta `public/`, ligados
nestas rotas de API. Siga a ordem abaixo.

## 1. Preencha o `.env`
Copie `.env.example` para `.env` e preencha:
- `MP_ACCESS_TOKEN`: no site do Mercado Pago, vá em **Seu negócio > Configurações >
  Credenciais > Credenciais de produção** e copie o "Access Token".
- `JWT_SECRET`: qualquer frase longa aleatória.
- `ADMIN_EMAIL` / `ADMIN_SENHA_INICIAL`: seu login do painel de gestor.

## 2. Rode localmente para testar
```
npm install
npm start
```
Abre em `http://localhost:3000`. Teste o login admin e criar um cliente antes de publicar.

## 3. Publique num servidor real (grátis pra começar)
Recomendo **Render.com** (tem plano free, sobe direto do GitHub):
1. Suba esta pasta pra um repositório no GitHub.
2. No Render: **New > Web Service** → conecte o repositório.
3. Build command: `npm install` — Start command: `npm start`.
4. Cole as mesmas variáveis do seu `.env` na aba **Environment** do Render.
5. Ao final você recebe uma URL tipo `https://seuapp.onrender.com` — essa é o `APP_URL`
   que você atualiza no `.env` e é o **link único que você vai mandar pros clientes**.

## 4. Configure o webhook do Mercado Pago
No painel do Mercado Pago → **Suas integrações > Webhooks**, cole:
`https://seuapp.onrender.com/webhook/mercadopago`
Isso é o que ativa/bloqueia o cliente sozinho quando o Pix ou cartão é pago ou falha —
sem você precisar mexer em nada manualmente.

## 5. Ícones do app
Coloque dois arquivos PNG em `public/icons/`: `icon-192.png` (192x192) e
`icon-512.png` (512x512) com a logo que você criar. Sem isso o app instala com ícone
genérico.

## 6. Como o cliente "baixa" o app (Android / iPhone / Windows)
Não existe download de arquivo — é instalação direta pelo link, o navegador oferece
sozinho:
- **Android (Chrome):** abre o link → aparece "Adicionar à tela inicial" → vira ícone de
  app normal, abre em tela cheia.
- **iPhone (Safari):** abre o link → toca em Compartilhar → **Adicionar à Tela de
  Início**.
- **Windows (Edge/Chrome):** abre o link → ícone de instalação na barra de endereço →
  vira um programa na área de trabalho/menu iniciar.

Você manda **um único link** pra todo mundo, funciona nos três.

## O que ainda depende de você configurar (não dá pra automatizar daqui)
- Domínio próprio (opcional, deixa mais profissional que `onrender.com`) — compra em
  Registro.br ou Namecheap, aponta pro Render.
- Conta de email transacional (ex: Resend, grátis até 3 mil emails/mês) se quiser enviar
  a senha automaticamente por email em vez de copiar/colar manualmente — hoje o painel
  do gestor mostra a senha pra você copiar e mandar.
- Ícones/identidade visual da marca.

## Segurança — não pule isso
- Nunca suba o arquivo `.env` pro GitHub (já vem um `.gitignore` te lembrando).
- Depois que estiver no ar, troque `ADMIN_SENHA_INICIAL` por um hash de verdade (o
  código de login do admin hoje é simplificado pra teste — antes de ter clientes reais,
  me chame de novo aqui pra eu reforçar essa parte com hash + 2FA).
