import { Router } from "express";
import {
  createRefundRequest,
  getRefundRequests,
  processRefundRequest,
} from "../controllers/refunds.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getRefundRequests);
router.post("/", authenticate, createRefundRequest);
router.patch("/:id", authenticate, processRefundRequest);

export default router;
