import { z } from "zod";

/**
 * O que a tela de boas-vindas mostra depois do aceite: o cartao do convite e o
 * resumo do cadastro.
 *
 * Existe porque o aceite consome o token, e a tela de boas-vindas nao tem mais
 * de onde ler o convite. Atravessa a navegacao por um cookie de vida curta —
 * ver `welcome-cookie`. Nada aqui e segredo: sao os mesmos dados que a tela de
 * aceite ja mostrava a essa pessoa.
 */
export const welcomeSummarySchema = z.object({
  name: z.string(),
  email: z.string(),
  role: z.string(),
  invitedBy: z.string(),
  circuit: z.string(),
  circuitCity: z.string(),
  circuitState: z.string(),
  congregation: z.string(),
  congregationCode: z.string(),
});

export type WelcomeSummary = z.infer<typeof welcomeSummarySchema>;
