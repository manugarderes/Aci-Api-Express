import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getAll,
  getById,
  processAutomatedReminders,
  verifyWebhook,
} from "../controllers/message.controller.js";

const router = Router();

router.get("/test-cron", processAutomatedReminders);

router.use(authMiddleware);

router.get("/", getAll);
router.get("/:id", getById);

router.get("/webhook", verifyWebhook);

export default router;
