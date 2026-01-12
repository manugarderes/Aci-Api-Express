import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getMetrics, getMine } from "../controllers/company.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getMine);
router.get("/metrics", getMetrics);

export default router;
