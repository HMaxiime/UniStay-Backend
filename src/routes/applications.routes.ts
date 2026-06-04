import express, { type RequestHandler } from "express";
import {
  applyToJob,
  getEmployerApplications,
  getJobApplications,
  getMyJobApplications,
  updateJobApplicationStatus,
} from "../controllers/applications.controller.js";
import {
  authenticate,
  requireStudent,
  requireEmployer,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my", authenticate, requireStudent, getMyJobApplications);
router.post("/jobs/:jobId", authenticate, requireStudent, applyToJob);
router.get("/employer", authenticate, requireEmployer, getEmployerApplications);
router.get("/jobs/:jobId", authenticate, requireEmployer, getJobApplications);
router.put(
  "/:applicationId/status",
  authenticate,
  requireEmployer,
  updateJobApplicationStatus,
);

export default router;
