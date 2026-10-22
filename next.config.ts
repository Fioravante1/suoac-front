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

/**
 * A rota de redefinicao carrega o token no proprio endereco.
 *
 * O link chega por e-mail montado pelo backend como
 * `${FRONTEND_URL}/reset-password?token=…`, entao o token na URL e parte do
 * contrato e nao da para mover para outro lugar. O que da para fazer e impedir
 * que ele saia da pagina: com `strict-origin-when-cross-origin`, requisicao
 * **de mesma origem** leva a URL inteira no `Referer` — e toda imagem e todo
 * chunk de `/_next/static` que a pagina carrega e de mesma origem. O token
 * entraria no log de acesso do proprio servidor.
 *
 * `no-referrer` corta isso. Nada na tela depende de `Referer`: a protecao de
 * CSRF das Server Actions compara `Origin`, nao `Referer`.
 */
const resetPasswordHeaders = [{ key: "Referrer-Policy", value: "no-referrer" }];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      /*
       * Depois da regra geral de proposito: quando duas regras casam o mesmo
       * caminho e a mesma chave, a ultima vence.
       */
      {
        source: "/reset-password",
        headers: resetPasswordHeaders,
      },
    ];
  },
};

export default nextConfig;
