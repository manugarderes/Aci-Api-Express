export interface Ticket {
  id: number;
  total: number;
  currency: string;
  due_date: string | null; // date
  ticket_url: string | null;
  payment_url: string | null;
  payment_secret: string;
  paid: boolean;
  client_id: number;
  created_at: string;
  updated_at: string;
}
