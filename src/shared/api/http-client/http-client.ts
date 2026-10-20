import "server-only";

import { getAccessToken, deleteSession } from "@/shared/auth/session";
import { refreshSession } from "@/shared/auth/refresh-session";
import { SESSION_EXPIRED_MESSAGE } from "@/shared/auth/constants";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface HttpClientOptions {
  method?: HttpMethod;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  /**
   * Endpoint publico: nao le o token da sessao, nao o envia e nao tenta renovar
   * em `401`.
   *
   * Nao e so economia de cabecalho. A renovacao escreve cookie, e escrever
   * cookie e permitido apenas em Server Action e Route Handler — num Server
   * Component, o Next lanca `ReadonlyRequestCookiesError`, que nao e
   * `HttpError` e chega ao chamador como falha sem veredito. Endpoint publico
   * chamado em render precisa ficar fora dessa maquinaria.
   */
  anonymous?: boolean;
}

async function performRequest(path: string, options: HttpClientOptions, token: string | null): Promise<Response> {
  const { method = "GET", body, headers = {} } = options;

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

async function parseErrorMessage(response: Response): Promise<string> {
  let message = `Request failed with status ${response.status}`;

  try {
    const errorBody = (await response.json()) as { message?: string };
    if (errorBody.message) {
      message = errorBody.message;
    }
  } catch {
    // Use default message if body parsing fails
  }

  return message;
}

/**
 * Variante de `httpClient` para respostas não-JSON (ex.: binário/PDF). Retorna o `Response` cru,
 * aplicando a mesma lógica de refresh-on-401. O chamador é responsável por consumir o corpo
 * (`body`/`blob`/`text`) e repassar status/headers.
 *
 * - sucesso/erros não-401 → retorna o `Response` cru (o chamador repassa status + corpo);
 * - 401 com token → tenta refresh e refaz a requisição;
 * - 401 sem token ou refresh falho → encerra a sessão e lança `HttpError(401, SESSION_EXPIRED_MESSAGE)`;
 * - `anonymous` → sem token e sem refresh: o 401 volta cru, como os demais erros.
 */
export async function httpClientRaw(path: string, options: HttpClientOptions = {}): Promise<Response> {
  const token = options.anonymous ? null : await getAccessToken();
  const response = await performRequest(path, options, token);

  // Em requisicao anonima nao ha sessao para expirar: o `401` e so mais um
  // status de erro, repassado cru como qualquer outro.
  if (response.status !== 401 || options.anonymous) {
    return response;
  }

  if (!token) {
    await deleteSession();
    throw new HttpError(401, SESSION_EXPIRED_MESSAGE);
  }

  const newToken = await refreshSession();

  if (!newToken) {
    await deleteSession();
    throw new HttpError(401, SESSION_EXPIRED_MESSAGE);
  }

  return performRequest(path, options, newToken);
}

export async function httpClient<T>(path: string, options: HttpClientOptions = {}): Promise<T> {
  const token = options.anonymous ? null : await getAccessToken();
  const response = await performRequest(path, options, token);

  if (response.ok) {
    return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
  }

  if (response.status !== 401 || !token) {
    const message = await parseErrorMessage(response);
    throw new HttpError(response.status, message);
  }

  const newToken = await refreshSession();

  if (!newToken) {
    await deleteSession();
    throw new HttpError(401, SESSION_EXPIRED_MESSAGE);
  }

  const retryResponse = await performRequest(path, options, newToken);

  if (!retryResponse.ok) {
    const retryMessage = await parseErrorMessage(retryResponse);
    throw new HttpError(retryResponse.status, retryMessage);
  }

  return retryResponse.status === 204 ? (undefined as T) : (retryResponse.json() as Promise<T>);
}
