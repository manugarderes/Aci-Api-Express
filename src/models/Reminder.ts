import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

export interface ReminderAttributes {
  id: number;
  companyId: number;
  daysFromDue: number;
  channel: "email" | "whatsapp" | "whatsapp_ai";
  template?: string | null;
}

export interface ReminderCreationAttributes
  extends Optional<ReminderAttributes, "id" | "template"> {}

export class Reminder extends Model<
  ReminderAttributes,
  ReminderCreationAttributes
> implements ReminderAttributes {
  public id!: number;
  public companyId!: number;
  public daysFromDue!: number;
  public channel!: "email" | "whatsapp" | "whatsapp_ai";
  public template!: string | null;
}

Reminder.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    daysFromDue: { type: DataTypes.INTEGER, allowNull: false },
    channel: {
      type: DataTypes.ENUM("email", "whatsapp", "whatsapp_ai"),
      allowNull: false,
    },
    template: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "reminders", sequelize }
);
