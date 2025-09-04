import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getMine } from "../controllers/company.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getMine);

export default router;
