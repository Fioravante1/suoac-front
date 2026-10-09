import { AuthProvider } from "@/shared/auth";
import { getSession } from "@/shared/auth/session";
import { ThemeProvider, type ThemePreference } from "@/shared/theme";
import { ToastProvider } from "@/shared/ui/toast";

import { QueryProvider } from "./query-provider";

type AppProvidersProps = Readonly<{
  children: React.ReactNode;
  /** Preferencia de tema lida do cookie no `RootLayout`. */
  themePreference: ThemePreference | null;
}>;

export async function AppProviders({ children, themePreference }: AppProvidersProps) {
  const session = await getSession();

  return (
    <ThemeProvider initialPreference={themePreference}>
      <AuthProvider user={session}>
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
