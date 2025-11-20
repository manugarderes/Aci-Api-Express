import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database.js";

export interface UserAttributes {
  id: number;
  name: string;
  password: string;
  isAdmin: boolean;
  companyId: number;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "isAdmin"> {}

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  declare id: number;
  declare name: string;
  declare password: string;
  declare isAdmin: boolean;
  declare companyId: number;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    name: { type: DataTypes.STRING(120), allowNull: false, unique: true  },

    password: { type: DataTypes.STRING(200), allowNull: false },

    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_admin",
    },

    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "company_id",
    },
  },
  {
    tableName: "users",
    sequelize,
  }
);