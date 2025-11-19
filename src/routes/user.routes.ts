import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";

import {
  getAllUsers,
  createUser,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/", authMiddleware, getAllUsers);
router.post("/", authMiddleware, createUser);
router.delete("/:id", authMiddleware, deleteUser);

export default router;