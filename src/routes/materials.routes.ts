import express from "express";
import {
  createMaterial,
  deleteMaterial,
  getMaterialById,
  getMaterials,
  updateMaterial,
} from "../controllers/materials.controller.js";


const router = express.Router();

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: List materials
 *     tags: [Materials]
 *     responses:
 *       200:
 *         description: Materials list
 *   post:
 *     summary: Create a material
 *     tags: [Materials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialInput'
 *     responses:
 *       201:
 *         description: Material created
 * /api/materials/{id}:
 *   get:
 *     summary: Get material by ID
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material found
 *   put:
 *     summary: Update material
 *     tags: [Materials]
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
 *             $ref: '#/components/schemas/MaterialInput'
 *     responses:
 *       200:
 *         description: Material updated
 *   delete:
 *     summary: Delete material
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Material deleted
 */
router.post("/", createMaterial);
router.get("/", getMaterials);
router.get("/:id", getMaterialById);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

export default router;
