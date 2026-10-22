import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { appMetadata } from "@/app/config/metadata";
import { AppProviders } from "@/app/providers/app-providers";
import { getThemePreference } from "@/shared/theme/theme-cookie";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = appMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Lido no servidor para que o tema ja venha aplicado na primeira pintura. Sem
  // preferencia nenhuma, o atributo e omitido e a pagina fica clara — ver
  // `app/globals.css`.
  const themePreference = await getThemePreference();

  return (
    <html
      lang="pt-BR"
      data-theme={themePreference ?? undefined}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <AppProviders themePreference={themePreference}>{children}</AppProviders>
      </body>
    </html>
  );
}
