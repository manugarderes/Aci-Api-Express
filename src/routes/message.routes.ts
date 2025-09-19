import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getAll, getById } from "../controllers/message.controller.js";

const router = Router();
router.use(authMiddleware);

router.get("/", getAll);
router.get("/:id", getById);

export default router;
