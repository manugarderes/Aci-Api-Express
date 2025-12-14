type ReminderChannel = "whatsapp" | "email" | "sms";

export interface Reminder {
  id: number;
  company_id: number;
  days_from_due: number;
  channel: ReminderChannel;
  template: string | null;
  created_at: string;
  updated_at: string;
}