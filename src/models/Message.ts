export type MessageType = "MAIL" | "WSP" | "CALL";

export interface Message {
  id: number;
  type: MessageType;
  content: string;
  ticket_id: number;
  reminder_id: number | null;
  created_at: string;
  updated_at: string;
}