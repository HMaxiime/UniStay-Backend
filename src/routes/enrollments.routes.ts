import { Router, type RequestHandler } from "express";
import { createEnrollment } from "../controllers/enrollments.controller.js";
import { authenticate, requireStudent } from "../middleware/auth.middleware.js";

const router = Router();

const auth = authenticate as RequestHandler;
const student = requireStudent as RequestHandler;

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Enroll authenticated student in a course
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enrollment created
 */
router.post("/", auth, student, createEnrollment);

export default router;
