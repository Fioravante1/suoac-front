import "server-only";

/**
 * Assinatura HMAC-SHA256 do cookie de sessão do usuário (`suoac-user`).
 *
 * Por que existe: o cookie carrega dados que escopam requisições ao backend
 * (`circuitId`, `congregationId`, `role`). Sem assinatura, um usuário poderia
 * editar o cookie no navegador (DevTools/proxy) e alterar esses valores para
 * tentar acessar dados de outro circuito ou elevar o próprio papel. Assinando o
 * payload, qualquer adulteração invalida a assinatura e a sessão é descartada
 * (`unsignSession` retorna `null`). A autoridade final continua sendo o backend
 * (que valida o access token); isto é defesa em profundidade no BFF.
 *
 * Usa Web Crypto (`crypto.subtle`), disponível tanto no runtime Node quanto Edge.
 */

const SEPARATOR = ".";
const encoder = new TextEncoder();

function getSecretKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

/**
 * Serializa o payload da sessão num token assinado no formato `<payload>.<hmac>`,
 * onde `payload` é o JSON original em base64url e `hmac` é a assinatura desse
 * trecho. O token resultante é o valor gravado no cookie.
 */
export async function signSession(payload: string): Promise<string> {
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const key = await getSecretKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));

  return `${encodedPayload}${SEPARATOR}${Buffer.from(signature).toString("base64url")}`;
}

/**
 * Verifica e desserializa um token de sessão assinado. Retorna o payload original
 * quando a assinatura confere, ou `null` quando o token é malformado, foi
 * adulterado ou o segredo não está configurado (fail-closed). A verificação via
 * `crypto.subtle.verify` é constant-time, evitando timing attacks.
 */
export async function unsignSession(token: string): Promise<string | null> {
  const separatorIndex = token.lastIndexOf(SEPARATOR);

  if (separatorIndex <= 0) {
    return null;
  }

  const encodedPayload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  try {
    const key = await getSecretKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      Buffer.from(signature, "base64url"),
      encoder.encode(encodedPayload),
    );

    if (!valid) {
      return null;
    }

    return Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}
