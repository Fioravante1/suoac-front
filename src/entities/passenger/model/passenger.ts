export interface Passenger {
  id: string;
  name: string;
  rg: string;
  phone: string | null;
  observations: string | null;
  congregationId: string;
  congregationName?: string;
  createdAt: string;
  updatedAt: string;
}

export function formatPassengerPhone(phone: string | null): string {
  return phone?.trim() ? phone : "Sem telefone";
}

export function formatPassengerObservations(observations: string | null): string {
  return observations?.trim() ? observations : "Sem observações";
}
