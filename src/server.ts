// src/server.ts
import app from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

(async () => {
  try {
    // ⚠️ En Vercel no debemos levantar un puerto
    if (process.env.VERCEL) {
      console.log("Running on Vercel runtime; server listen is disabled.");
      return;
    }

    app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error inicializando:", err);
    process.exit(1);
  }
})();
