import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getAll,
  getById,
  handleIncomingMessage,
  processAutomatedReminders,
  verifyWebhook,
} from "../controllers/message.controller.js";

const router = Router();

router.get("/test-cron", processAutomatedReminders);

router.get("/webhook", verifyWebhook);
router.post("/webhook", handleIncomingMessage);

router.use(authMiddleware);

router.get("/", getAll);
router.get("/:id", getById);

export default router;
