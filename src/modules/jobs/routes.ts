import { Router } from "express";
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} from "./controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// Public
router.get("/", getJobs);
router.get("/:id", getJobById);

// Protected
router.use(authenticate);
router.post("/", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;
