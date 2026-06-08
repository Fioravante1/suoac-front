import { z } from "zod";

const RG_REGEX = /^[\d.\-xX]{5,14}$/;

const enrollPassengerBaseSchema = z.object({
  mode: z.enum(["existing", "inline"]),
  passengerId: z.string().optional(),
  name: z.string().optional(),
  rg: z.string().optional(),
  phone: z.string().optional(),
  dayIds: z.array(z.string()).optional(),
  observations: z.string().max(500).optional(),
  exemptionReason: z.string().max(300).optional(),
  isExempt: z.boolean().optional(),
  includePayment: z.boolean().optional(),
  paymentAmount: z
    .number({ message: "Informe um valor válido." })
    .positive("O valor deve ser maior que zero.")
    .multipleOf(0.01, "O valor deve ter no máximo 2 casas decimais.")
    .optional(),
  paymentPaidAt: z.string().optional(),
  paymentObservations: z
    .string()
    .max(500, "Observações devem ter no máximo 500 caracteres.")
    .optional()
    .or(z.literal("")),
});

type EnrollPassengerBaseValues = z.infer<typeof enrollPassengerBaseSchema>;
type EnrollPassengerRefinementContext = z.RefinementCtx;

function validateExistingPassenger(values: EnrollPassengerBaseValues, ctx: EnrollPassengerRefinementContext) {
  if (values.passengerId) return;

  ctx.addIssue({ code: "custom", message: "Selecione um passageiro.", path: ["passengerId"] });
}

function validateInlinePassenger(values: EnrollPassengerBaseValues, ctx: EnrollPassengerRefinementContext) {
  if (!values.name || values.name.length < 2) {
    ctx.addIssue({ code: "custom", message: "Nome deve ter pelo menos 2 caracteres.", path: ["name"] });
  }

  if (!values.rg || !RG_REGEX.test(values.rg)) {
    ctx.addIssue({ code: "custom", message: "RG inválido. Use dígitos, pontos, hífens e X.", path: ["rg"] });
  }

  if (!values.phone || values.phone.length === 0 || values.phone.length >= 8) return;

  ctx.addIssue({ code: "custom", message: "Telefone deve ter pelo menos 8 caracteres.", path: ["phone"] });
}

function validateExemption(values: EnrollPassengerBaseValues, ctx: EnrollPassengerRefinementContext) {
  if (!values.isExempt) return;
  if (values.exemptionReason?.trim()) return;

  ctx.addIssue({ code: "custom", message: "Informe o motivo da isenção.", path: ["exemptionReason"] });
}

function validatePayment(values: EnrollPassengerBaseValues, ctx: EnrollPassengerRefinementContext) {
  if (!values.includePayment) return;

  if (values.isExempt) {
    ctx.addIssue({ code: "custom", message: "Passageiro isento não pode ter pagamento.", path: ["includePayment"] });
    return;
  }

  if (!values.paymentAmount || values.paymentAmount <= 0) {
    ctx.addIssue({ code: "custom", message: "Informe o valor do pagamento.", path: ["paymentAmount"] });
  }

  if (!values.paymentPaidAt) {
    ctx.addIssue({ code: "custom", message: "Informe a data do pagamento.", path: ["paymentPaidAt"] });
  } else {
    const paidDate = new Date(values.paymentPaidAt);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (paidDate > today) {
      ctx.addIssue({ code: "custom", message: "A data do pagamento não pode ser futura.", path: ["paymentPaidAt"] });
    }
  }
}

export const enrollPassengerSchema = enrollPassengerBaseSchema.superRefine((data, ctx) => {
  if (data.mode === "existing") {
    validateExistingPassenger(data, ctx);
  } else {
    validateInlinePassenger(data, ctx);
  }

  validateExemption(data, ctx);
  validatePayment(data, ctx);
});

export type EnrollPassengerFormValues = z.infer<typeof enrollPassengerSchema>;

export interface EnrollPassengerPayload {
  passengerId?: string;
  name?: string;
  rg?: string;
  phone?: string;
  dayIds?: string[];
  observations?: string;
  exemptionReason?: string;
  payment?: {
    amount: number;
    paidAt: string;
    observations?: string;
  };
}

function fillPassengerPayload(payload: EnrollPassengerPayload, values: EnrollPassengerFormValues) {
  if (values.mode === "existing") {
    payload.passengerId = values.passengerId;
    return;
  }

  payload.name = values.name;
  payload.rg = values.rg;

  if (values.phone) {
    payload.phone = values.phone;
  }
}

export function toEnrollPayload(values: EnrollPassengerFormValues): EnrollPassengerPayload {
  const payload: EnrollPassengerPayload = {};

  fillPassengerPayload(payload, values);

  if (values.dayIds && values.dayIds.length > 0) {
    payload.dayIds = values.dayIds;
  }

  if (values.observations?.trim()) {
    payload.observations = values.observations.trim();
  }

  if (values.isExempt && values.exemptionReason?.trim()) {
    payload.exemptionReason = values.exemptionReason.trim();
  }

  if (!values.includePayment || !values.paymentAmount || !values.paymentPaidAt) {
    return payload;
  }

  const trimmedObs = values.paymentObservations?.trim();

  payload.payment = {
    amount: values.paymentAmount,
    paidAt: new Date(values.paymentPaidAt).toISOString(),
    ...(trimmedObs && { observations: trimmedObs }),
  };

  return payload;
}
