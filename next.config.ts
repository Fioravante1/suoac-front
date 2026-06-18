import type { NextConfig } from "next";

/**
 * Headers de segurança estáticos, aplicados a todas as respostas.
 *
 * O `Content-Security-Policy` NÃO fica aqui: ele depende de um nonce por
 * requisição e é gerado no `proxy.ts`. Os headers abaixo são fixos e independem
 * da requisição.
 */
const securityHeaders = [
  // Força HTTPS em acessos futuros (2 anos), incluindo subdomínios.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Defesa contra clickjacking (complementa frame-ancestors da CSP; cobre browsers antigos).
  { key: "X-Frame-Options", value: "DENY" },
  // Impede MIME sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limita o vazamento de URL no header Referer para origens externas.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs sensíveis do navegador que o app não usa.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
