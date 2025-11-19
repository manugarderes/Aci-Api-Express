import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

export interface CompanyAttributes {
  id: number;
  name: string;
  logo: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
}

export interface CompanyCreationAttributes
  extends Optional<CompanyAttributes, "id" | "logo" | "colorPrimary" | "colorSecondary"> {}

export class Company
  extends Model<CompanyAttributes, CompanyCreationAttributes>
  implements CompanyAttributes
{
  declare id: number;
  declare name: string;
  declare logo: string | null;
  declare colorPrimary: string | null;
  declare colorSecondary: string | null;
}

Company.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false, unique: true },

    logo: { type: DataTypes.STRING(500), allowNull: true },
    colorPrimary: { type: DataTypes.STRING(50), allowNull: true },
    colorSecondary: { type: DataTypes.STRING(50), allowNull: true }
  },
  { tableName: "companies", sequelize }
);