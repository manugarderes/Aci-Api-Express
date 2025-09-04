import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

export interface CompanyAttributes {
  id: number;
  name: string;
  password: string;
}

export interface CompanyCreationAttributes extends Optional<CompanyAttributes, "id"> {}

export class Company extends Model<CompanyAttributes, CompanyCreationAttributes>
  implements CompanyAttributes {
  declare id: number;
  declare name: string;
  declare password: string;
}

Company.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(200), allowNull: false }
  },
  { tableName: "companies", sequelize }
);
