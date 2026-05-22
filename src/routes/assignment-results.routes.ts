import { Router, type RequestHandler } from "express";
import { startAssignmentResult } from "../controllers/assignment-results.controller.js";
import { authenticate, requireStudent } from "../middleware/auth.middleware.js";

const router = Router();

const auth = authenticate as unknown as RequestHandler;
const student = requireStudent as unknown as RequestHandler;

router.post("/start", auth, student, startAssignmentResult as unknown as RequestHandler);

export default router;
