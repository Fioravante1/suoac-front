import { QueryClient, QueryCache } from "@tanstack/react-query";

import {
  isSessionExpiredError,
  isPasswordChangeRequiredError,
  redirectOnAuthError,
} from "@/shared/auth/session-redirect";

/** Erros de auth que disparam hard navigation, não devem repetir nem propagar à UI. */
function isAuthRedirectError(error: unknown): boolean {
  return isSessionExpiredError(error) || isPasswordChangeRequiredError(error);
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: redirectOnAuthError,
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
