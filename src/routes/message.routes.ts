import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { create, getAll, getById, updateById, removeById } from "../controllers/message.controller.js";

const router = Router();
router.use(authMiddleware);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getById);
router.patch("/:id", updateById);
router.delete("/:id", removeById);

export default router;
