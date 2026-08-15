const CRIPTO = [
  { symbol: "BINANCE:BTCUSDT", label: "BTC/USDT" },
  { symbol: "BINANCE:ETHUSDT", label: "ETH/USDT" },
  { symbol: "BINANCE:SOLUSDT", label: "SOL/USDT" },
  { symbol: "BINANCE:BNBUSDT", label: "BNB/USDT" },
  { symbol: "BINANCE:XRPUSDT", label: "XRP/USDT" },
  { symbol: "BINANCE:DOGEUSDT", label: "DOGE/USDT" },
];
const FOREX = [
  { symbol: "FX:EURUSD", label: "EUR/USD" },
  { symbol: "FX:GBPUSD", label: "GBP/USD" },
  { symbol: "FX:USDJPY", label: "USD/JPY" },
  { symbol: "FX:AUDUSD", label: "AUD/USD" },
  { symbol: "OANDA:XAUUSD", label: "XAU/USD (Ouro)" },
];
const TIMEFRAMES = [
  { key: "1m", label: "M1" },
  { key: "5m", label: "M5" },
  { key: "15m", label: "M15" },
  { key: "1h", label: "M1H" },
];
let timeframeAtual = "5m";

function criarWidget(container, ativo) {
  container.innerHTML = "";
  const card = document.createElement("div");
  card.className = "card card-sinal";

  const titulo = document.createElement("div");
  titulo.className = "mono";
  titulo.style.cssText = "font-weight:700;font-size:14px;margin-bottom:8px;padding:0 4px;display:flex;align-items:center;gap:6px;";
  titulo.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:var(--green);display:inline-block;"></span>${ativo.label}`;
  card.appendChild(titulo);

  const widgetWrap = document.createElement("div");
  widgetWrap.className = "tradingview-widget-container";
  const widgetInner = document.createElement("div");
  widgetInner.className = "tradingview-widget-container__widget";
  widgetWrap.appendChild(widgetInner);
  card.appendChild(widgetWrap);
  container.appendChild(card);

  // Script criado e anexado por último, com o container já conectado ao documento
  // (URL correta do carregador oficial da TradingView).
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
  script.appendChild(document.createTextNode(JSON.stringify({
    interval: timeframeAtual,
    width: "100%",
    isTransparent: true,
    height: 280,
    symbol: ativo.symbol,
    showIntervalTabs: false,
    displayMode: "single",
    locale: "br",
    colorTheme: "dark",
  })));
  widgetWrap.appendChild(script);
}

function montarSeletorTimeframe() {
  const el = document.getElementById("seletor-tf");
  el.innerHTML = "";
  TIMEFRAMES.forEach((tf) => {
    const btn = document.createElement("button");
    btn.textContent = tf.label;
    btn.className = "mono";
    btn.style.cssText = `padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;border:none;cursor:pointer;transition:all .15s;background:${tf.key === timeframeAtual ? "var(--green)" : "transparent"};color:${tf.key === timeframeAtual ? "#0a0d12" : "var(--muted)"};`;
    btn.onclick = () => { timeframeAtual = tf.key; montarSeletorTimeframe(); montarGrades(); };
    el.appendChild(btn);
  });
}

function montarGrades() {
  const gridCripto = document.getElementById("grid-cripto");
  const gridForex = document.getElementById("grid-forex");
  gridCripto.innerHTML = "";
  gridForex.innerHTML = "";
  CRIPTO.forEach((ativo) => {
    const slot = document.createElement("div");
    gridCripto.appendChild(slot);
    criarWidget(slot, ativo);
  });
  FOREX.forEach((ativo) => {
    const slot = document.createElement("div");
    gridForex.appendChild(slot);
    criarWidget(slot, ativo);
  });
}

function mostrarPainel() {
  document.getElementById("tela-login").classList.add("hidden");
  document.getElementById("tela-trocar-senha").classList.add("hidden");
  document.getElementById("tela-painel").classList.remove("hidden");
  montarSeletorTimeframe();
  montarGrades();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(() => {});
}

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;
  const erroEl = document.getElementById("login-erro");
  erroEl.textContent = "";
  try {
    const res = await fetch("/api/cliente/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    if (!res.ok) { erroEl.textContent = data.erro || "Erro ao entrar"; return; }
    localStorage.setItem("token_cliente", data.token);
    if (data.precisaTrocarSenha) {
      document.getElementById("tela-login").classList.add("hidden");
      document.getElementById("tela-trocar-senha").classList.remove("hidden");
    } else {
      mostrarPainel();
    }
  } catch {
    erroEl.textContent = "Não foi possível conectar ao servidor.";
  }
});

document.getElementById("form-trocar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const novaSenha = document.getElementById("nova-senha").value;
  const erroEl = document.getElementById("trocar-erro");
  erroEl.textContent = "";
  try {
    const res = await fetch("/api/cliente/trocar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token_cliente") },
      body: JSON.stringify({ novaSenha }),
    });
    const data = await res.json();
    if (!res.ok) { erroEl.textContent = data.erro || "Erro ao salvar"; return; }
    mostrarPainel();
  } catch {
    erroEl.textContent = "Não foi possível conectar ao servidor.";
  }
});

if (localStorage.getItem("token_cliente"))
