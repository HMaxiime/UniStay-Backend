import express from "express";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  updateAssignment,
} from "../controllers/assignments.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: List assignments
 *     tags: [Assignments]
 *     responses:
 *       200:
 *         description: Assignments list
 *   post:
 *     summary: Create an assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignmentInput'
 *     responses:
 *       201:
 *         description: Assignment created
 * /api/assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assignment found
 *   put:
 *     summary: Update assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignmentInput'
 *     responses:
 *       200:
 *         description: Assignment updated
 *   delete:
 *     summary: Delete assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Assignment deleted
 */
router.post("/",authenticate, createAssignment);
router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
router.put("/:id", authenticate, updateAssignment);
router.delete("/:id", authenticate, deleteAssignment);

export default router;
