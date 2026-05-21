"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @media (prefers-reduced-motion: reduce) {
                .ge-illustration { animation: none !important; }
                .ge-layout { animation: none !important; }
              }
              @media (min-width: 640px) {
                .ge-layout {
                  flex-direction: row !important;
                  gap: 3rem !important;
                  max-width: 50rem !important;
                }
                .ge-illustration {
                  max-width: 22rem !important;
                  flex-shrink: 0;
                }
                .ge-content {
                  align-items: flex-start !important;
                  text-align: left !important;
                }
                .ge-actions {
                  justify-content: flex-start !important;
                }
              }
              @media (min-width: 480px) {
                .ge-actions {
                  flex-direction: row !important;
                }
              }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: "radial-gradient(ellipse at 50% 30%, #e6f4ef 0%, transparent 70%) #f7f9f8",
          color: "#1e1f24",
        }}
      >
        <div
          className="ge-layout"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            width: "100%",
            maxWidth: "28rem",
            padding: "1.5rem",
            animation: "fadeIn 0.5s ease-out both",
          }}
        >
          <img
            className="ge-illustration"
            src="/empty_state_onibus_sem_fundo.png"
            alt=""
            width={320}
            height={160}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "18rem",
              height: "auto",
              flexShrink: 0,
              animation: "float 5s ease-in-out infinite",
            }}
          />
          <div
            className="ge-content"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "0.75rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Ops, algo não saiu como esperado</h2>
            <p
              style={{
                fontSize: "1rem",
                color: "#667085",
                lineHeight: 1.5,
              }}
            >
              Estamos com dificuldades para carregar esta página. Tente novamente ou volte ao início.
            </p>
            <div
              className="ge-actions"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                marginTop: "0.75rem",
                width: "100%",
              }}
            >
              <button
                onClick={() => unstable_retry()}
                style={{
                  height: "2.75rem",
                  padding: "0 1.5rem",
                  backgroundColor: "#1f6e5a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "1rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Tentar novamente
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                style={{
                  height: "2.75rem",
                  padding: "0 1.5rem",
                  backgroundColor: "transparent",
                  color: "#1e1f24",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "1rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
