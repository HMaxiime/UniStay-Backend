import express, { type RequestHandler } from "express";
import {
  applyToJob,
  getJobApplications,
  getMyJobApplications,
  updateJobApplicationStatus,
} from "../controllers/applications.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
const auth = authenticate as RequestHandler;

/**
 * @swagger
 * /api/applications/my:
 *   get:
 *     summary: List authenticated student's job applications
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student applications list
 * /api/applications/jobs/{jobId}:
 *   post:
 *     summary: Apply for a job as a student
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Application submitted
 *       409:
 *         description: Student already applied
 *   get:
 *     summary: List applications for a job
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job applications list
 * /api/applications/{applicationId}/status:
 *   patch:
 *     summary: Update a job application status
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplicationStatusInput'
 *     responses:
 *       200:
 *         description: Application status updated
 */
router.get("/my", auth, getMyJobApplications );
router.post("/jobs/:jobId", auth, applyToJob );
router.get("/jobs/:jobId", auth, getJobApplications );
router.patch("/:applicationId/status", auth, updateJobApplicationStatus );

export default router;
