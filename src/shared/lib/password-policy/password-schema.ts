import { z } from "zod";

import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MAX_LENGTH_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  isPasswordCompliant,
} from "./password-policy";

/**
 * Campo de senha nova, com as regras que a API exige.
 *
 * Usado por toda tela que define senha, para que nenhuma delas valide menos que
 * o servidor. A mensagem de complexidade e uma so, em vez de uma por requisito:
 * a lista de pendencias fica no medidor de forca, ao lado do campo, enquanto a
 * pessoa digita — repetir tudo no erro de submit seria ruido.
 */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE)
  .max(PASSWORD_MAX_LENGTH, PASSWORD_MAX_LENGTH_MESSAGE)
  .refine(isPasswordCompliant, PASSWORD_COMPLEXITY_MESSAGE);
