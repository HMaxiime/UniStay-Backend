import express, { type RequestHandler } from "express";
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  updateJob,
} from "../controllers/jobs.controller.js";
import { authenticate , requireEmployer } from "../middleware/auth.middleware.js";

const router = express.Router();
const auth = authenticate as unknown as RequestHandler;
const employer = requireEmployer as unknown as RequestHandler;

router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/", auth, employer, createJob as unknown as RequestHandler);
router.put("/:id", auth, employer, updateJob as unknown as RequestHandler);
router.delete("/:id", auth, employer, deleteJob as unknown as RequestHandler);

export default router;
