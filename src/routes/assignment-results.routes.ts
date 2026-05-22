import { Router, type RequestHandler } from "express";
import { startAssignmentResult } from "../controllers/assignment-results.controller.js";
import { authenticate, requireStudent } from "../middleware/auth.middleware.js";

const router = Router();

const auth = authenticate as RequestHandler;
const student = requireStudent as RequestHandler;

router.post("/start", auth, student, startAssignmentResult);

export default router;
