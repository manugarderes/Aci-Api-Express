import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import { Ticket } from "./Ticket.js";

export type MessageType = "MAIL" | "WSP" | "CALL";

export interface MessageAttributes {
  id: number;
  type: MessageType;
  content: string;
  ticketId: number;
}

export interface MessageCreationAttributes extends Optional<MessageAttributes, "id"> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes {
  declare id: number;
  declare type: MessageType;
  declare content: string;
  declare ticketId: number;
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
      field: "ticket_id"
    }
  },
  { tableName: "messages", sequelize }
);
