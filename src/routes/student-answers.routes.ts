import { Router, type RequestHandler } from "express";
import { submitStudentAnswers } from "../controllers/student-answers.controller.js";
import { authenticate, requireStudent } from "../middleware/auth.middleware.js";

const router = Router();

const auth = authenticate as unknown as RequestHandler;
const student = requireStudent as unknown as RequestHandler;

/**
 * @swagger
 * /api/student-answers:
 *   post:
 *     summary: Submit student answers
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignmentResultId, answers]
 *             properties:
 *               assignmentResultId:
 *                 type: string
 *               userId:
 *                 type: string
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Answers submitted
 */
router.post("/", auth, student, submitStudentAnswers as unknown as RequestHandler);

export default router;
