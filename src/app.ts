// src/app.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import clientRoutes from "./routes/client.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { errorHandler } from "./utils/error.js";
import { startup } from "./startup.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// 🔶 Inicialización por cold start (una sola vez por instancia)
app.use(async (_req, _res, next) => {
  try {
    await startup();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/companies", companyRoutes);
app.use("/clients", clientRoutes);
app.use("/tickets", ticketRoutes);
app.use("/messages", messageRoutes);

app.use(errorHandler);

export default app;
