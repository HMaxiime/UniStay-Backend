import { Router, type RequestHandler } from "express";
import { createEnrollment } from "../controllers/enrollments.controller.js";
import { authenticate, requireStudent } from "../middleware/auth.middleware.js";

const router = Router();

const auth = authenticate as unknown as RequestHandler;
const student = requireStudent as unknown as RequestHandler;

router.post("/", auth, student, createEnrollment as unknown as RequestHandler);

export default router;
