import { z } from "zod";

export const registerPaymentSchema = z
  .object({
    amount: z
      .number({ message: "Informe um valor válido." })
      .positive("O valor deve ser maior que zero.")
      .multipleOf(0.01, "O valor deve ter no máximo 2 casas decimais."),
    paidAt: z.string().min(1, "Informe a data do pagamento."),
    observations: z.string().max(500, "Observações devem ter no máximo 500 caracteres.").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const paid = new Date(data.paidAt);
      const now = new Date();
      now.setHours(23, 59, 59, 999);

      return paid <= now;
    },
    { message: "A data do pagamento não pode ser futura.", path: ["paidAt"] },
  );

export type RegisterPaymentFormValues = z.infer<typeof registerPaymentSchema>;

export interface CreatePaymentPayload {
  amount: number;
  paidAt: string;
  observations?: string;
}

export function toCreatePaymentPayload(values: RegisterPaymentFormValues): CreatePaymentPayload {
  const payload: CreatePaymentPayload = {
    amount: values.amount,
    paidAt: new Date(values.paidAt).toISOString(),
  };

  const trimmed = values.observations?.trim();

  if (trimmed) {
    payload.observations = trimmed;
  }

  return payload;
}
