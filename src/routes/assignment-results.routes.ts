import { Router, type RequestHandler } from "express";
import { startAssignmentResult } from "../controllers/assignment-results.controller.js";
import { authenticate, requireStudent } from "../middleware/auth.middleware.js";

const router = Router();

const auth = authenticate as RequestHandler;
const student = requireStudent as RequestHandler;

/**
 * @swagger
 * /api/assignment-results/start:
 *   post:
 *     summary: Start an assignment
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignmentId]
 *             properties:
 *               assignmentId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment result started
 */
router.post("/start", auth, student, startAssignmentResult as RequestHandler);

export default router;
