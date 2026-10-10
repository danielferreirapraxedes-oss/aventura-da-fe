// Servidor do Aventura da Fé RPG
// Não precisa instalar nada: usa só o que já vem no Node.js.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORTA = process.env.PORT || 3000;
const PASTA_PUBLICA = path.join(__dirname, "public");
const PASTA_DADOS = process.env.DATA_DIR || __dirname;
const ARQUIVO_DADOS = path.join(PASTA_DADOS, "dados.json");

/* ---------- Dados (contas e acertos) ---------- */

let dados = { usuarios: {} };
try {
    dados = JSON.parse(fs.readFileSync(ARQUIVO_DADOS, "utf8"));
} catch (e) { /* primeira vez: começa vazio */ }
if (!dados.usuarios) dados.usuarios = {};

function salvar() {
    const temp = ARQUIVO_DADOS + ".tmp";
    fs.writeFileSync(temp, JSON.stringify(dados));
    fs.renameSync(temp, ARQUIVO_DADOS);
}

/* ---------- Senhas (nunca guardadas em texto aberto) ---------- */

function gerarHash(senha, sal) {
    return crypto.scryptSync(senha, sal, 64);
}

function criarSenha(senha) {
    const sal = crypto.randomBytes(16).toString("hex");
    return { sal: sal, hash: gerarHash(senha, sal).toString("hex") };
}

function senhaConfere(senha, usuario) {
    const esperado = Buffer.from(usuario.hash, "hex");
    const recebido = gerarHash(senha, usuario.sal);
    return crypto.timingSafeEqual(esperado, recebido);
}

/* ---------- Limite de tentativas (contra quem tenta adivinhar senha) ---------- */

const tentativas = new Map();

function excedeuLimite(ip) {
    const agora = Date.now();
    let t = tentativas.get(ip);
    if (!t || agora > t.ate) {
        t = { n: 0, ate: agora + 10 * 60 * 1000 };
        tentativas.set(ip, t);
    }
    t.n++;
    return t.n > 40;
}

/* ---------- Ajudantes ---------- */

function responder(res, status, objeto) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(objeto));
}

function lerCorpo(req) {
    return new Promise(function (ok, erro) {
        let texto = "";
        req.on("data", function (pedaco) {
            texto += pedaco;
            if (texto.length > 10000) {
                erro(new Error("grande"));
                req.destroy();
            }
        });
        req.on("end", function () {
            try { ok(JSON.parse(texto || "{}")); }
            catch (e) { erro(new Error("json")); }
        });
    });
}

function usuarioPorToken(token) {
    if (typeof token !== "string" || token.length < 20) return null;
    for (const chave in dados.usuarios) {
        if (dados.usuarios[chave].token === token) return dados.usuarios[chave];
    }
    return null;
}

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOME_OK = /^[\p{L}\p{N}_ .-]+$/u;

/* ---------- API ---------- */

async function api(req, res, rota) {
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();

    if (rota === "/api/placar" && req.method === "GET") {
        const lista = Object.values(dados.usuarios)
            .filter(function (u) { return u.acertos > 0; })
            .sort(function (a, b) { return b.acertos - a.acertos; })
            .slice(0, 20)
            .map(function (u) { return { usuario: u.nome, acertos: u.acertos }; });
        return responder(res, 200, { ok: true, placar: lista });
    }

    if (req.method !== "POST") return responder(res, 405, { ok: false, erro: "Método não permitido" });

    let corpo;
    try { corpo = await lerCorpo(req); }
    catch (e) { return responder(res, 400, { ok: false, erro: "Pedido inválido" }); }

    if (rota === "/api/cadastro") {
        if (excedeuLimite(ip)) return responder(res, 429, { ok: false, erro: "Muitas tentativas. Espere alguns minutos." });

        const nome = String(corpo.usuario || "").trim();
        const email = String(corpo.email || "").trim();
        const senha = String(corpo.senha || "");

        if (nome.length < 3 || nome.length > 20 || !NOME_OK.test(nome))
            return responder(res, 400, { ok: false, erro: "O usuário precisa ter de 3 a 20 letras ou números." });
        if (!EMAIL_OK.test(email) || email.length > 100)
            return responder(res, 400, { ok: false, erro: "E-mail inválido! Use um e-mail completo, como daniel@gmail.com" });
        if (senha.length < 4 || senha.length > 50)
            return responder(res, 400, { ok: false, erro: "A senha precisa ter pelo menos 4 caracteres." });

        const chave = nome.toLowerCase();
        if (dados.usuarios[chave])
            return responder(res, 409, { ok: false, erro: "Esse usuário já existe. Escolha outro nome." });

        const s = criarSenha(senha);
        dados.usuarios[chave] = { nome: nome, email: email, sal: s.sal, hash: s.hash, acertos: 0, token: null };
        salvar();
        return responder(res, 200, { ok: true });
    }

    if (rota === "/api/login") {
        if (excedeuLimite(ip)) return responder(res, 429, { ok: false, erro: "Muitas tentativas. Espere alguns minutos." });

        const chave = String(corpo.usuario || "").trim().toLowerCase();
        const senha = String(corpo.senha || "");
        const u = dados.usuarios[chave];

        if (!u || !senhaConfere(senha, u))
            return responder(res, 401, { ok: false, erro: "Usuário ou senha incorretos!" });

        u.token = crypto.randomBytes(24).toString("hex");
        salvar();
        return responder(res, 200, { ok: true, token: u.token, usuario: u.nome, acertos: u.acertos });
    }

    if (rota === "/api/acerto") {
        const u = usuarioPorToken(corpo.token);
        if (!u) return responder(res, 401, { ok: false, erro: "Sessão expirada. Entre de novo." });

        const ganho = Number(corpo.ganho);
        if (ganho !== 1 && ganho !== 3)
            return responder(res, 400, { ok: false, erro: "Valor inválido" });

        u.acertos += ganho;
        salvar();
        return responder(res, 200, { ok: true, acertos: u.acertos });
    }

    return responder(res, 404, { ok: false, erro: "Não encontrado" });
}

/* ---------- Arquivos do site (index.html, sprites, perguntas...) ---------- */

const TIPOS = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".wav": "audio/wav",
    ".json": "application/json; charset=utf-8",
    ".ico": "image/x-icon"
};

function arquivo(req, res, rota) {
    let caminho;
    try { caminho = decodeURIComponent(rota); }
    catch (e) { res.writeHead(400); return res.end("Pedido inválido"); }

    if (caminho === "/") caminho = "/index.html";

    const completo = path.normalize(path.join(PASTA_PUBLICA, caminho));
    if (!completo.startsWith(PASTA_PUBLICA + path.sep)) {
        res.writeHead(403);
        return res.end("Proibido");
    }

    fs.readFile(completo, function (erro, conteudo) {
        if (erro) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            return res.end("Arquivo não encontrado");
        }
        const ext = path.extname(completo).toLowerCase();
        const cabecalhos = { "Content-Type": TIPOS[ext] || "application/octet-stream" };
        if (ext === ".html") cabecalhos["Cache-Control"] = "no-cache";
        res.writeHead(200, cabecalhos);
        res.end(conteudo);
    });
}

/* ---------- Servidor ---------- */

http.createServer(function (req, res) {
    const rota = (req.url || "/").split("?")[0];

    if (rota.startsWith("/api/")) {
        api(req, res, rota).catch(function (e) {
            console.error(e);
            responder(res, 500, { ok: false, erro: "Erro no servidor" });
        });
    } else if (req.method === "GET" || req.method === "HEAD") {
        arquivo(req, res, rota);
    } else {
        res.writeHead(405);
        res.end();
    }
}).listen(PORTA, "0.0.0.0", function () {
    console.log("Jogo no ar na porta " + PORTA);
});
