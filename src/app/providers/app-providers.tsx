import { AuthProvider } from "@/shared/auth";
import { getSession } from "@/shared/auth/session";
import { ToastProvider } from "@/shared/ui/toast";

import { QueryProvider } from "./query-provider";

type AppProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

export async function AppProviders({ children }: AppProvidersProps) {
  const session = await getSession();

  return (
    <AuthProvider user={session}>
      <QueryProvider>
        <ToastProvider>{children}</ToastProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
