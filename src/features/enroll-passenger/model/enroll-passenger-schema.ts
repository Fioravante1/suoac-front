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

export const enrollPassengerSchema = enrollPassengerBaseSchema.superRefine((data, ctx) => {
  if (data.mode === "existing") {
    validateExistingPassenger(data, ctx);
    validateExemption(data, ctx);
    return;
  }

  validateInlinePassenger(data, ctx);
  validateExemption(data, ctx);
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

  return payload;
}
