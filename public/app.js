const ATIVOS = [
  { symbol: "BTCUSDT", label: "BTC/USDT" },
  { symbol: "ETHUSDT", label: "ETH/USDT" },
  { symbol: "SOLUSDT", label: "SOL/USDT" },
  { symbol: "BNBUSDT", label: "BNB/USDT" },
  { symbol: "XRPUSDT", label: "XRP/USDT" },
  { symbol: "DOGEUSDT", label: "DOGE/USDT" },
];
const TIMEFRAMES = [
  { key: "1m", label: "M1" },
  { key: "5m", label: "M5" },
  { key: "15m", label: "M15" },
  { key: "1h", label: "M1H" },
];
let timeframeAtual = "5m";
let intervaloAtualizacao = null;

function ema(values, period) {
  const k = 2 / (period + 1);
  const out = [values[0]];
  for (let i = 1; i < values.length; i++) out.push(values[i] * k + out[i - 1] * (1 - k));
  return out;
}
function rsi(values, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period, avgLoss = losses / period, last = 50;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const gain = d > 0 ? d : 0, loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    last = 100 - 100 / (1 + rs);
  }
  return last;
}
function macdHist(values) {
  const e12 = ema(values, 12), e26 = ema(values, 26);
  const macdLine = e12.map((v, i) => v - e26[i]);
  const sig = ema(macdLine, 9);
  return macdLine[macdLine.length - 1] - sig[sig.length - 1];
}
function computeSignal(closes) {
  const e9 = ema(closes, 9), e21 = ema(closes, 21);
  const emaBull = e9[e9.length - 1] > e21[e21.length - 1];
  const rsiVal = rsi(closes, 14);
  const rsiBull = rsiVal > 50 && rsiVal < 75;
  const rsiBear = rsiVal < 50 && rsiVal > 25;
  const hist = macdHist(closes);
  const macdBull = hist > 0;
  let scoreBull = (emaBull ? 1 : 0) + (rsiBull ? 1 : 0) + (macdBull ? 1 : 0);
  let scoreBear = (!emaBull ? 1 : 0) + (rsiBear ? 1 : 0) + (!macdBull ? 1 : 0);
  let signal = "NEUTRO", confluence = Math.max(scoreBull, scoreBear);
  if (scoreBull >= 2) { signal = "COMPRA"; confluence = scoreBull; }
  else if (scoreBear >= 2) { signal = "VENDA"; confluence = scoreBear; }
  return { signal, confluence, rsi: rsiVal, macdHist: hist, price: closes[closes.length - 1] };
}
async function fetchKlines(symbol, interval) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("erro");
  const data = await res.json();
  return data.map((k) => parseFloat(k[4]));
}

function badgeClasse(signal) {
  return signal === "COMPRA" ? "ativo" : signal === "VENDA" ? "bloqueado" : "teste";
}

function montarSeletorTimeframe() {
  const el = document.getElementById("seletor-tf");
  el.innerHTML = "";
  TIMEFRAMES.forEach((tf) => {
    const btn = document.createElement("button");
    btn.textContent = tf.label;
    btn.className = "mono";
    btn.style.cssText = `padding:7px 12px;border-radius:7px;font-size:12px;font-weight:700;border:none;cursor:pointer;background:${tf.key === timeframeAtual ? "var(--green)" : "transparent"};color:${tf.key === timeframeAtual ? "#0a0d12" : "var(--muted)"};`;
    btn.onclick = () => { timeframeAtual = tf.key; montarSeletorTimeframe(); atualizarSinais(); };
    el.appendChild(btn);
  });
}

async function atualizarSinais() {
  const grid = document.getElementById("grid-ativos");
  const cards = {};
  for (const ativo of ATIVOS) {
    let card = document.getElementById("card-" + ativo.symbol);
    if (!card) {
      card = document.createElement("div");
      card.className = "card";
      card.id = "card-" + ativo.symbol;
      card.innerHTML = `<div class="mono" style="color:var(--muted);font-size:12px;">carregando…</div>`;
      grid.appendChild(card);
    }
    cards[ativo.symbol] = card;
  }
  await Promise.all(ATIVOS.map(async (ativo) => {
    try {
      const closes = await fetchKlines(ativo.symbol, timeframeAtual);
      const r = computeSignal(closes);
      const casas = r.price < 10 ? 4 : 2;
      cards[ativo.symbol].innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span class="mono" style="font-weight:700;font-size:14px;">${ativo.label}</span>
          <span class="badge ${badgeClasse(r.signal)}">${r.signal}</span>
        </div>
        <div class="mono" style="font-size:18px;margin-bottom:10px;">${r.price.toLocaleString("pt-BR",{minimumFractionDigits:casas,maximumFractionDigits:casas})}</div>
        <div class="mono" style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);">
          <span>RSI ${r.rsi.toFixed(0)}</span>
          <span>MACD ${r.macdHist > 0 ? "+" : ""}${r.macdHist.toFixed(2)}</span>
        </div>`;
    } catch {
      cards[ativo.symbol].innerHTML = `<div class="mono" style="color:var(--amber);font-size:12px;">dados indisponíveis</div>`;
    }
  }));
}

function mostrarPainel() {
  document.getElementById("tela-login").classList.add("hidden");
  document.getElementById("tela-trocar-senha").classList.add("hidden");
  document.getElementById("tela-painel").classList.remove("hidden");
  montarSeletorTimeframe();
  atualizarSinais();
  clearInterval(intervaloAtualizacao);
  intervaloAtualizacao = setInterval(atualizarSinais, 20000);
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

if (localStorage.getItem("token_cliente")) mostrarPainel();
