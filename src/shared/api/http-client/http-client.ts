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

export async function httpClient<T>(path: string, options: HttpClientOptions = {}): Promise<T> {
  const token = await getAccessToken();

  const response = await performRequest(path, options, token);

  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }

  if (response.status === 401 && token) {
    const newToken = await refreshSession();

    if (newToken) {
      const retryResponse = await performRequest(path, options, newToken);

      if (retryResponse.ok) {
        if (retryResponse.status === 204) {
          return undefined as T;
        }
        return retryResponse.json() as Promise<T>;
      }

      const retryMessage = await parseErrorMessage(retryResponse);
      throw new HttpError(retryResponse.status, retryMessage);
    }

    await deleteSession();
    throw new HttpError(401, SESSION_EXPIRED_MESSAGE);
  }

  const message = await parseErrorMessage(response);
  throw new HttpError(response.status, message);
}
