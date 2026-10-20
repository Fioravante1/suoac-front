import { createServer } from "node:http";

const port = Number(process.env.E2E_API_PORT ?? "3101");
const passwordResetRequests = [];
const passwordResets = [];

/*
 * O estado do token e decidido pelo proprio valor dele, nao por estado guardado
 * no servidor. Assim cada teste escolhe o cenario pela URL que visita, sem
 * ordem entre testes nem passo de preparacao — e a suite roda em paralelo.
 *
 * Os valores nao imitam o formato real (hex de tamanho fixo): o alvo aqui e o
 * comportamento do frontend diante de cada resposta, e token legivel faz o teste
 * dizer o que testa. O formato real e validado pelo DTO do backend, que tem
 * teste proprio la.
 */
const TOKEN_BEHAVIOR = {
  "token-valido": { verify: 204, reset: 204 },
  "token-expirado": { verify: 410, reset: 410 },
  "token-usado": { verify: 409, reset: 409 },
  "token-invalido": { verify: 400, reset: 400 },
  "token-instavel": { verify: 500, reset: 500 },
  // Passa na abertura e e recusado no envio: e a aba que ficou aberta ate o link
  // vencer, ou o link usado em outro dispositivo nesse meio-tempo.
  "token-vence-na-aba": { verify: 204, reset: 410 },
  /*
   * Tokens validos proprios de cada teste que inspeciona o que foi enviado. A
   * suite roda em paralelo contra este mesmo servidor, entao o token e o que
   * identifica o teste no registro — por isso nenhum teste limpa o registro, o
   * que apagaria o do vizinho.
   */
  "token-nao-relido": { verify: 204, reset: 204 },
  "token-politica": { verify: 204, reset: 204 },
  /*
   * Unico token que **consome**: depois de redefinido, a verificacao passa a
   * responder `409`, como o backend faz ao gravar `usedAt`. Fica opt-in porque
   * tornar isso geral quebraria o paralelismo — `token-valido` e visitado por
   * varios testes ao mesmo tempo, e o primeiro a redefinir derrubaria os outros.
   */
  "token-consumivel": { verify: 204, reset: 204, consumable: true },
};

/** Tokens ja gastos, para a verificacao seguinte recusa-los. */
const consumedTokens = new Set();

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function sendEmpty(response, status) {
  response.writeHead(status);
  response.end();
}

/**
 * Corpo invalido vira `null`, nao excecao.
 *
 * Sem isto, um POST sem corpo estoura dentro do handler assincrono: a rejeicao
 * nao tratada derruba o processo do mock e leva junto todos os testes que ainda
 * faltavam, sem mensagem que explique o que houve.
 */
async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

/** `400` para token desconhecido e o que o backend faz com token que nao existe. */
function statusForToken(token, endpoint) {
  if (endpoint === "verify" && consumedTokens.has(token)) return 409;

  return TOKEN_BEHAVIOR[token]?.[endpoint] ?? 400;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendEmpty(response, 204);
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/__requests") {
    passwordResetRequests.length = 0;
    sendEmpty(response, 204);
    return;
  }

  if (request.method === "GET" && url.pathname === "/__requests") {
    sendJson(response, 200, { passwordResetRequests });
    return;
  }

  if (request.method === "GET" && url.pathname === "/__resets") {
    sendJson(response, 200, { passwordResets });
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/password-reset-requests") {
    passwordResetRequests.push(await readJson(request));
    sendEmpty(response, 204);
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/password-reset-verifications") {
    const body = await readJson(request);

    if (!body) {
      sendJson(response, 400, { message: "Corpo inválido." });
      return;
    }

    sendEmpty(response, statusForToken(body.token, "verify"));
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/password-resets") {
    const body = await readJson(request);

    if (!body) {
      sendJson(response, 400, { message: "Corpo inválido." });
      return;
    }

    // A URL crua e guardada para o teste provar que o token nao viajou na query
    // string — ela entra em log de acesso, no historico e no `Referer`.
    passwordResets.push({ body, requestUrl: request.url });

    const status = statusForToken(body.token, "reset");

    if (status === 204 && TOKEN_BEHAVIOR[body.token]?.consumable) {
      consumedTokens.add(body.token);
    }

    sendEmpty(response, status);
    return;
  }

  sendJson(response, 404, { message: "Rota não simulada no E2E." });
});

server.listen(port, "127.0.0.1");

process.on("SIGTERM", () => server.close());
