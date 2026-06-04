import express, { type RequestHandler } from "express";
import {
  applyToJob,
  getEmployerApplications,
  getJobApplications,
  getMyJobApplications,
  updateJobApplicationStatus,
  uploadApplicationResume,
} from "../controllers/applications.controller.js";
import {
  authenticate,
  requireStudent,
  requireEmployer,
} from "../middleware/auth.middleware.js";
import upload from "../config/multer.js";

const router = express.Router();

router.get("/my", authenticate, requireStudent, getMyJobApplications);
router.post("/jobs/:jobId", authenticate, requireStudent, applyToJob);
router.post("/:id/resume", authenticate, requireStudent, upload.single("file"), uploadApplicationResume as unknown as RequestHandler);
router.get("/employer", authenticate, requireEmployer, getEmployerApplications);
router.get("/jobs/:jobId", authenticate, requireEmployer, getJobApplications);
router.put(
  "/:applicationId/status",
  authenticate,
  requireEmployer,
  updateJobApplicationStatus,
);

export default router;
