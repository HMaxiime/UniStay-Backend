import express from "express";
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  updateQuestion,
} from "../controllers/questions.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a question
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput'
 *     responses:
 *       201:
 *         description: Question created
 * /api/questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question found
 *   put:
 *     summary: Update question
 *     tags: [Questions]
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
 *             $ref: '#/components/schemas/QuestionInput'
 *     responses:
 *       200:
 *         description: Question updated
 *   delete:
 *     summary: Delete question
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Question deleted
 */
router.post("/", createQuestion);
router.get("/:id", getQuestionById);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

export default router;
