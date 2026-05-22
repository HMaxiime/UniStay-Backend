import { Router, type RequestHandler } from "express";
import { submitStudentAnswers } from "../controllers/student-answers.controller.js";
import { authenticate, requireStudent } from "../middleware/auth.middleware.js";

const router = Router();

const auth = authenticate as RequestHandler;
const student = requireStudent as RequestHandler;

router.post("/", auth, student, submitStudentAnswers);

export default router;
