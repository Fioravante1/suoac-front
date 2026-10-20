/** Dígitos de um telefone fixo com DDD. */
const LANDLINE_DIGITS = 10;

/** Dígitos de um celular com DDD e o nono dígito. */
const MOBILE_DIGITS = 11;

/** Comprimento da máscara cheia: `(11) 97753-0630`. */
export const PHONE_MASK_MAX_LENGTH = 15;

/** Só os dígitos, que é a forma que a API guarda. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Dígitos antes do hífen, depois do DDD: cinco no celular, quatro no fixo. */
function prefixLength(digitCount: number): number {
  return digitCount === MOBILE_DIGITS ? 7 : 6;
}

/**
 * Aplica a máscara brasileira enquanto a pessoa digita: `(11) 97753-0630` para
 * celular, `(11) 3333-4444` para fixo.
 *
 * Formata o que já existe em vez de exigir o número completo — a cada tecla o
 * valor precisa ser exibível, não só no fim. O que passa de 11 dígitos é
 * descartado: é o teto do formato, e deixar entrar faria a máscara produzir algo
 * que não é telefone.
 *
 * O hífen entra numa posição fixa e **não anda para trás** conforme se digita:
 * até dez dígitos o número é tratado como fixo, e só no décimo primeiro ele
 * vira celular e o bloco da frente ganha um dígito. A alternativa — pôr sempre
 * os quatro últimos depois do hífen, como o protótipo faz — produz
 * `(11) 97-7530` no meio da digitação, com o separador pulando a cada tecla.
 */
export function formatPhone(value: string): string {
  const digits = phoneDigits(value).slice(0, MOBILE_DIGITS);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);

  if (digits.length <= 6) {
    return `(${areaCode}) ${digits.slice(2)}`;
  }

  const pivot = prefixLength(digits.length);

  return `(${areaCode}) ${digits.slice(2, pivot)}-${digits.slice(pivot)}`;
}

/** Mantém o cursor junto ao dígito editado, mesmo quando a máscara muda. */
export function formatPhoneInput(value: string, caret: number): { value: string; caret: number } {
  const formatted = formatPhone(value);
  const digitsBeforeCaret = Math.min(phoneDigits(value.slice(0, caret)).length, MOBILE_DIGITS);

  if (digitsBeforeCaret === 0) {
    return { value: formatted, caret: 0 };
  }

  let seen = 0;
  const position = Array.from(formatted).findIndex((character) => {
    seen += /\d/.test(character) ? 1 : 0;
    return seen === digitsBeforeCaret;
  });

  return { value: formatted, caret: position + 1 };
}

/** Número de telefone completo, fixo ou celular, com DDD. */
export function isCompletePhone(value: string): boolean {
  const digits = phoneDigits(value).length;

  return digits >= LANDLINE_DIGITS && digits <= MOBILE_DIGITS;
}
