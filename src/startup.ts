// src/startup.ts
import { sequelize, initAssociations } from "./models/index.js";

let bootstrapped = false;

export const startup = async () => {
  if (bootstrapped) return;
  await sequelize.authenticate();
  initAssociations();

  // Para arrancar rápido. En prod “ideal” usar migraciones (CLI) en vez de sync().
  await sequelize.sync({ alter: true });

  bootstrapped = true;
};
