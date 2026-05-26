import { Router, type RequestHandler } from "express";
import { submitStudentAnswers } from "../controllers/student-answers.controller.js";
import { authenticate, requireStudent } from "../middleware/auth.middleware.js";

const router = Router();

const auth = authenticate as unknown as RequestHandler;
const student = requireStudent as unknown as RequestHandler;

router.post("/", auth, student, submitStudentAnswers as unknown as RequestHandler);

export default router;
