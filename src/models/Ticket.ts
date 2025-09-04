import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import { Client } from "./Client.js";

export interface TicketAttributes {
  id: number;
  total: number;
  dueDate: Date | null;
  ticketUrl: string | null;
  paymentUrl: string | null;
  paymentSecret: string; 
  paid: boolean;
  clientId: number;
}

export interface TicketCreationAttributes
  extends Optional<TicketAttributes, "id" | "dueDate" | "ticketUrl" | "paymentUrl" | "paid"> {}

export class Ticket extends Model<TicketAttributes, TicketCreationAttributes>
  implements TicketAttributes {
  declare id: number;
  declare total: number;
  declare dueDate: Date | null;
  declare ticketUrl: string | null;
  declare paymentUrl: string | null;
  declare paymentSecret: string;
  declare paid: boolean;
  declare clientId: number;
}

Ticket.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    dueDate: { type: DataTypes.DATE, allowNull: true, field: "due_date" },
    ticketUrl: { type: DataTypes.STRING(500), allowNull: true, field: "ticket_url" },
    paymentUrl: { type: DataTypes.STRING(500), allowNull: true, field: "payment_url" },
    paymentSecret: { type: DataTypes.STRING(200), allowNull: false, field: "payment_secret" },
    paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Client, key: "id" },
      field: "client_id"
    }
  },
  { tableName: "tickets", sequelize }
);
