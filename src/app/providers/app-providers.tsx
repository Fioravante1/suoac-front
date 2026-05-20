import { AuthProvider } from "@/shared/auth";
import { getSession } from "@/shared/auth/session";

import { QueryProvider } from "./query-provider";

type AppProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

export async function AppProviders({ children }: AppProvidersProps) {
  const session = await getSession();

  return (
    <AuthProvider user={session}>
      <QueryProvider>{children}</QueryProvider>
    </AuthProvider>
  );
}
