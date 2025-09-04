import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  create, getAll, getById, updateById, removeById, payWithSecret, getAllByClient
} from "../controllers/ticket.controller.js";

const router = Router();

router.post("/:id/pay", payWithSecret);

router.use(authMiddleware);
router.post("/", create);
router.get("/", getAll);
router.get("/by-client/:clientId", getAllByClient);
router.get("/:id", getById);
router.patch("/:id", updateById);
router.delete("/:id", removeById);

export default router;
