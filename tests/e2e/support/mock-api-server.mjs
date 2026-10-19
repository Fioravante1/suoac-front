import { createServer } from "node:http";

const port = Number(process.env.E2E_API_PORT ?? "3101");
const passwordResetRequests = [];

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);

  if (request.method === "GET" && url.pathname === "/health") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/__requests") {
    passwordResetRequests.length = 0;
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/__requests") {
    sendJson(response, 200, { passwordResetRequests });
    return;
  }

  if (request.method === "POST" && url.pathname === "/auth/password-reset-requests") {
    passwordResetRequests.push(await readJson(request));
    response.writeHead(204);
    response.end();
    return;
  }

  sendJson(response, 404, { message: "Rota não simulada no E2E." });
});

server.listen(port, "127.0.0.1");

process.on("SIGTERM", () => server.close());
