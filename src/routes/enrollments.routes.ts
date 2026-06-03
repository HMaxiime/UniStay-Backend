import { Router, type RequestHandler } from "express";
import { createEnrollment, getInstructorEnrollments, getMyLearningProfile } from "../controllers/enrollments.controller.js";
import { authenticate, requireInstructor, requireStudent } from "../middleware/auth.middleware.js";

const router = Router();

const auth = authenticate as RequestHandler;
const student = requireStudent as RequestHandler;

router.post("/", auth, student, createEnrollment);
router.get("/profile", auth, student, getMyLearningProfile);
router.get("/instructor", auth, requireInstructor, getInstructorEnrollments);

export default router;
