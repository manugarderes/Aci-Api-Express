import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  create,
  getAllUnPaid,
  getAllPaid,
  getById,
  updateById,
  removeById,
  payWithSecret,
  getAllByClient,
  getPublicTicket,
} from "../controllers/ticket.controller.js";

const router = Router();

router.post("/:id/pay", payWithSecret);
router.post("/public", getPublicTicket);

router.use(authMiddleware);

router.post("/", create);
router.get("/unpaid", getAllUnPaid);
router.get("/paid", getAllPaid);
router.get("/by-client/:clientId", getAllByClient);
router.get("/:id", getById);
router.patch("/:id", updateById);
router.delete("/:id", removeById);

export default router;
