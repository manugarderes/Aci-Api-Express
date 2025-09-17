import { Router } from "express";
import * as reminderController from "../controllers/reminder.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", reminderController.getAll);
router.post("/", reminderController.create);
router.get("/:id", reminderController.getById);
router.patch("/:id", reminderController.updateById);
router.delete("/:id", reminderController.removeById);

export default router;
