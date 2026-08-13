const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "troque-este-segredo";

function gerarSenhaAleatoria() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function hashSenha(senha) {
  return bcrypt.hash(senha, 10);
}

async function conferirSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}

function gerarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

function verificarToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ erro: "Não autenticado" });
  try {
    const token = header.replace("Bearer ", "");
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

function apenasAdmin(req, res, next) {
  if (req.usuario?.tipo !== "admin") return res.status(403).json({ erro: "Acesso restrito ao gestor" });
  next();
}

module.exports = { gerarSenhaAleatoria, hashSenha, conferirSenha, gerarToken, verificarToken, apenasAdmin };
