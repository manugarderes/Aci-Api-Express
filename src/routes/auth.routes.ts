import { Router } from "express";
import { getUser, register, login } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";
const router = Router();

router.get("/", authMiddleware, getUser);
router.post("/register", register);
router.post("/login", login);

export default router;
