// Cliente HTTP simples para falar com a API FastAPI.
// O token JWT fica em memória + localStorage e vai no header Authorization.

const TOKEN_KEY = "helpdesk_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const resp = await fetch("/api" + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let dados = null;
  const texto = await resp.text();
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resp.ok) {
    // FastAPI manda erros em "detail" (string ou lista de validação)
    let msg = "Erro inesperado.";
    if (dados && typeof dados.detail === "string") msg = dados.detail;
    else if (dados && Array.isArray(dados.detail)) msg = dados.detail.map((e) => e.msg).join(" ");
    const erro = new Error(msg);
    erro.status = resp.status;
    erro.dados = dados;
    throw erro;
  }
  return dados;
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b) => request("POST", p, b),
  patch: (p, b) => request("PATCH", p, b),
  put: (p, b) => request("PUT", p, b),
  del: (p) => request("DELETE", p),
};

// ---------- formatação ----------
export function formatarData(iso, comHora = true) {
  if (!iso) return "—";
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  if (!comHora) return data;
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} ${hora}`;
}

export function tempoRelativo(iso) {
  if (!iso) return "";
  const agora = new Date();
  const d = new Date(iso);
  const seg = Math.floor((agora - d) / 1000);
  if (seg < 60) return "agora há pouco";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias < 30) return `há ${dias} d`;
  return formatarData(iso, false);
}

export function iniciais(nome) {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
