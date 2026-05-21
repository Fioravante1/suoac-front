import { QueryClient, QueryCache } from "@tanstack/react-query";

import { SESSION_EXPIRED_MESSAGE } from "@/shared/auth/constants";

let isRedirecting = false;

function handleAuthError(error: Error) {
  if (isRedirecting) return;
  if (error.message !== SESSION_EXPIRED_MESSAGE) return;

  isRedirecting = true;
  const returnUrl = window.location.pathname + window.location.search;
  const params = new URLSearchParams({ sessionExpired: "true", returnUrl });
  window.location.href = `/login?${params.toString()}`;
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleAuthError,
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error.message === SESSION_EXPIRED_MESSAGE) return false;
          return failureCount < 1;
        },
        staleTime: 60 * 1000,
        throwOnError: (error) => error.message !== SESSION_EXPIRED_MESSAGE,
      },
    },
  });
}

/** @internal Exported for testing only */
export function resetRedirectingFlag() {
  isRedirecting = false;
}
