import type { PassengerFormValues } from "./passenger-form-schema";

function optionalTrimmedValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

export function normalizePassengerFormValues(values: PassengerFormValues) {
  return {
    name: values.name.trim(),
    rg: values.rg.trim(),
    phone: optionalTrimmedValue(values.phone),
    observations: optionalTrimmedValue(values.observations),
  };
}
