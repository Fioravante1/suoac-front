/**
 * Estados possiveis do token do link, e nao so "valido ou nao".
 *
 * Cada um tem texto e saida propria na tela: expirado e usado pedem link novo,
 * invalido sugere conferir o link do e-mail, e falha de rede e a unica que
 * permite tentar de novo. Colapsar isso num erro generico foi o que o card
 * SUC-26 proibiu explicitamente.
 */
export const TOKEN_STATES = ["valid", "expired", "used", "invalid", "unavailable"] as const;

export type TokenState = (typeof TOKEN_STATES)[number];
