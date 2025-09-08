import { sequelize } from "../config/database.js";
import { Company } from "./Company.js";
import { Client } from "./Client.js";
import { Ticket } from "./Ticket.js";
import { Message } from "./Message.js";

let initialized = false;

export const initAssociations = () => {
  if (initialized) return;
  initialized = true;

  Company.hasMany(Client, { as: "clients", foreignKey: "companyId" });
  Client.belongsTo(Company, { as: "company", foreignKey: "companyId" });

  Client.hasMany(Ticket, { as: "tickets", foreignKey: "clientId" });
  Ticket.belongsTo(Client, { as: "client", foreignKey: "clientId" });

  Ticket.hasMany(Message, { as: "messages", foreignKey: "ticketId" });
  Message.belongsTo(Ticket, { as: "ticket", foreignKey: "ticketId" });
};

export { sequelize, Company, Client, Ticket, Message };
