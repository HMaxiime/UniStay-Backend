import express, { type RequestHandler } from "express";
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  updateJob,
} from "../controllers/jobs.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
const auth = authenticate as unknown as RequestHandler;

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Jobs list
 *   post:
 *     summary: Create a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       201:
 *         description: Job created
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job found
 *   put:
 *     summary: Update job
 *     tags: [Jobs]
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
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       200:
 *         description: Job updated
 *   delete:
 *     summary: Delete job
 *     tags: [Jobs]
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
 *         description: Job deleted
 */
router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/", auth, createJob as unknown as RequestHandler);
router.put("/:id", auth, updateJob as unknown as RequestHandler);
router.delete("/:id", auth, deleteJob as unknown as RequestHandler);

export default router;
