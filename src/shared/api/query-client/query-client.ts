import { QueryClient, QueryCache } from "@tanstack/react-query";

import { isSessionExpiredError, redirectToSessionExpired } from "@/shared/auth/session-redirect";

function handleAuthError(error: Error): void {
  if (isSessionExpiredError(error)) redirectToSessionExpired();
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
          if (isSessionExpiredError(error)) return false;
          return failureCount < 1;
        },
        staleTime: 60 * 1000,
        throwOnError: (error) => !isSessionExpiredError(error),
      },
    },
  });
}
