function token() { return localStorage.getItem("token_admin"); }

async function api(path, options = {}) {
  const res = await fetch("/api/admin" + path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || "erro");
  return data;
}

document.getElementById("form-login-admin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("admin-email").value;
  const senha = document.getElementById("admin-senha").value;
  const erroEl = document.getElementById("admin-login-erro");
  erroEl.textContent = "";
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    if (!res.ok) { erroEl.textContent = data.erro || "Credenciais inválidas"; return; }
    localStorage.setItem("token_admin", data.token);
    mostrarAdmin();
  } catch {
    erroEl.textContent = "Não foi possível conectar ao servidor.";
  }
});

document.getElementById("btn-sair").addEventListener("click", () => {
  localStorage.removeItem("token_admin");
  location.reload();
});

document.getElementById("form-add").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("novo-email").value;
  const modo = document.getElementById("novo-modo").value;
  try {
    const data = await api("/clientes", { method: "POST", body: JSON.stringify({ email, modo }) });
    const box = document.getElementById("resultado-add");
    box.classList.remove("hidden");
    box.innerHTML = `
      <div class="mono" style="font-size:13px;line-height:1.8;">
        <div style="color:var(--green);font-weight:700;margin-bottom:6px;">Acesso liberado — copie e envie pro cliente:</div>
        <div>Email: ${data.email}</div>
        <div>Senha temporária: <b>${data.senha_temporaria}</b></div>
        ${data.linkPagamento ? `<div style="margin-top:6px;">Link de pagamento: <a href="${data.linkPagamento}" target="_blank" style="color:var(--green);">${data.linkPagamento}</a></div>` : ""}
      </div>`;
    document.getElementById("novo-email").value = "";
    carregarClientes();
  } catch (err) {
    alert(err.message);
  }
});

async function carregarClientes() {
  const clientes = await api("/clientes");
  const resumo = document.getElementById("resumo");
  const ativos = clientes.filter((c) => c.status === "ativo").length;
  const teste = clientes.filter((c) => c.status === "teste").length;
  const bloqueados = clientes.filter((c) => c.status === "bloqueado").length;
  resumo.innerHTML = `
    <div class="card"><div class="mono" style="font-size:22px;color:var(--green);font-weight:700;">${ativos}</div><div style="font-size:12px;color:var(--muted);">ativos</div></div>
    <div class="card"><div class="mono" style="font-size:22px;color:var(--amber);font-weight:700;">${teste}</div><div style="font-size:12px;color:var(--muted);">em teste</div></div>
    <div class="card"><div class="mono" style="font-size:22px;color:var(--red);font-weight:700;">${bloqueados}</div><div style="font-size:12px;color:var(--muted);">bloqueados</div></div>`;

  const lista = document.getElementById("lista-clientes");
  if (clientes.length === 0) {
    lista.innerHTML = `<p style="color:var(--muted);text-align:center;padding:24px;">Nenhum cliente cadastrado ainda.</p>`;
    return;
  }
  lista.innerHTML = clientes.map((c) => `
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
      <div>
        <div style="font-size:14px;">${c.email}</div>
        <div class="mono" style="font-size:11px;color:var(--muted);">desde ${new Date(c.criado_em).toLocaleDateString("pt-BR")}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span class="badge ${c.status}">${c.status.toUpperCase()}</span>
        <button class="btn-ghost mono" style="font-size:11px;padding:6px 10px;" onclick="alternarStatus(${c.id}, '${c.status}')">
          ${c.status === "bloqueado" ? "liberar" : "bloquear"}
        </button>
      </div>
    </div>`).join("");
}

async function alternarStatus(id, statusAtual) {
  const novo = statusAtual === "bloqueado" ? "ativo" : "bloqueado";
  await api(`/clientes/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: novo }) });
  carregarClientes();
}

function mostrarAdmin() {
  document.getElementById("tela-login").classList.add("hidden");
  document.getElementById("tela-admin").classList.remove("hidden");
  carregarClientes();
}

if (token()) mostrarAdmin();
