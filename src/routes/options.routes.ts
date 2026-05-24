import express from "express";
import {
  createOption,
  deleteOption,
  updateOption,
} from "../controllers/options.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/options:
 *   post:
 *     summary: Create an option
 *     tags: [Options]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OptionInput'
 *     responses:
 *       201:
 *         description: Option created
 * /api/options/{id}:
 *   put:
 *     summary: Update option
 *     tags: [Options]
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
 *             $ref: '#/components/schemas/OptionInput'
 *     responses:
 *       200:
 *         description: Option updated
 *   delete:
 *     summary: Delete option
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Option deleted
 */
router.post("/", createOption);
router.put("/:id", updateOption);
router.delete("/:id", deleteOption);

export default router;
