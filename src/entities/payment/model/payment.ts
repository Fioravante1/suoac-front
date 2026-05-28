export interface Payment {
  id: string;
  amount: string;
  paidAt: string;
  observations: string | null;
  eventPassengerId: string;
  registeredById: string;
  createdAt: string;
}
