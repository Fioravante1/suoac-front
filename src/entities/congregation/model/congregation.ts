export interface Congregation {
  id: string;
  code: string;
  name: string;
  email: string;
  city: string | null;
  isActive: boolean;
  circuitId: string;
  createdAt: string;
  updatedAt: string;
}
