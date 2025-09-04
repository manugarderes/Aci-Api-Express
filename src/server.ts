import app from "./app.js";
import { sequelize } from "./models/index.js";
import { initAssociations } from "./models/index.js";

const PORT = Number(process.env.PORT) || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    initAssociations();
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error inicializando:", err);
    process.exit(1);
  }
})();
