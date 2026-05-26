import express, { type RequestHandler } from "express";
import {
  applyToJob,
  getJobApplications,
  getMyJobApplications,
  updateJobApplicationStatus,
} from "../controllers/applications.controller.js";
import { authenticate , requireStudent } from "../middleware/auth.middleware.js";

const router = express.Router();
const auth = authenticate as RequestHandler;
const student = requireStudent as RequestHandler;

router.get("/my", auth, student, getMyJobApplications );
router.post("/jobs/:jobId", auth, student, applyToJob );
router.get("/jobs/:jobId", auth, student, getJobApplications );
router.patch("/:applicationId/status", auth, student, updateJobApplicationStatus );

export default router;
