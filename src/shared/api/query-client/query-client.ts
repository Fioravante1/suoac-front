import { QueryClient, QueryCache } from "@tanstack/react-query";

import {
  isSessionExpiredError,
  redirectToSessionExpired,
  isPasswordChangeRequiredError,
  redirectToPasswordChangeRequired,
} from "@/shared/auth/session-redirect";

/** Erros de auth que disparam hard navigation, não devem repetir nem propagar à UI. */
function isAuthRedirectError(error: unknown): boolean {
  return isSessionExpiredError(error) || isPasswordChangeRequiredError(error);
}

function handleAuthError(error: Error): void {
  if (isSessionExpiredError(error)) {
    redirectToSessionExpired();
    return;
  }

  if (isPasswordChangeRequiredError(error)) {
    redirectToPasswordChangeRequired();
  }
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
          if (isAuthRedirectError(error)) return false;
          return failureCount < 1;
        },
        staleTime: 60 * 1000,
        throwOnError: (error) => !isAuthRedirectError(error),
      },
    },
  });
}
