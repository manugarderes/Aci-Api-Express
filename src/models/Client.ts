import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";
import { Company } from "./Company.js";

export interface ClientAttributes {
  id: number;
  name: string;
  email: string;
  phone: string;   
  points: number;
  companyId: number;
}

export interface ClientCreationAttributes extends Optional<ClientAttributes, "id" | "points"> {}

export class Client extends Model<ClientAttributes, ClientCreationAttributes>
  implements ClientAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare points: number;
  declare companyId: number;
}

Client.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(40), allowNull: false },
    points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Company, key: "id" },
      field: "company_id"
    }
  },
  { tableName: "clients", sequelize }
);
