import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import { Ticket } from "./Ticket.js";
import { Reminder } from "./Reminder.js"; // Asegúrate de importar el modelo

export type MessageType = "MAIL" | "WSP" | "CALL";

export interface MessageAttributes {
  id: number;
  type: MessageType;
  content: string;
  ticketId: number;
  reminderId: number | null; // puede ser null si el mensaje no viene de un reminder
}

export interface MessageCreationAttributes
  extends Optional<MessageAttributes, "id" | "reminderId"> {}

export class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  declare id: number;
  declare type: MessageType;
  declare content: string;
  declare ticketId: number;
  declare reminderId: number | null;
}

Message.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.ENUM("MAIL", "WSP", "CALL"), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Ticket, key: "id" },
      field: "ticket_id",
    },
    reminderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Reminder, key: "id" },
      field: "reminder_id",
    },
  },
  { tableName: "messages", sequelize }
);
