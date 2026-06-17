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
 * - 401 sem token ou refresh falho → encerra a sessão e lança `HttpError(401, SESSION_EXPIRED_MESSAGE)`.
 */
export async function httpClientRaw(path: string, options: HttpClientOptions = {}): Promise<Response> {
  const token = await getAccessToken();
  const response = await performRequest(path, options, token);

  if (response.status !== 401) {
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
  const token = await getAccessToken();
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
