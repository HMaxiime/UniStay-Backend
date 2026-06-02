import { Router } from "express";
import { stripeWebhook } from "../controllers/stripe.controller.js";

const router = Router();

router.post("/webhook", stripeWebhook);

export default router;
