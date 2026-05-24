import express from "express";
import {
  createMaterialSkill,
  deleteMaterialSkill,
} from "../controllers/material-skills.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/material-skills:
 *   post:
 *     summary: Attach a skill to a material
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [materialId, skillId]
 *             properties:
 *               materialId:
 *                 type: string
 *               skillId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Material skill created
 * /api/material-skills/{id}:
 *   delete:
 *     summary: Remove a skill from a material
 *     tags: [Materials]
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
 *         description: Material skill deleted
 */
router.post("/", authenticate, createMaterialSkill);
router.delete("/:id", authenticate, deleteMaterialSkill);

export default router;
