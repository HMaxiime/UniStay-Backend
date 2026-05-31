import express, { type RequestHandler } from "express";
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  updateJob,
} from "../controllers/jobs.controller.js";
<<<<<<< HEAD
import { authenticate } from "../middleware/auth.middleware.js";
=======
import { authenticate , requireEmployer } from "../middleware/auth.middleware.js";
>>>>>>> main

const router = express.Router();
const auth = authenticate as unknown as RequestHandler;
const employer = requireEmployer as unknown as RequestHandler;

router.get("/", getJobs);
router.get("/:id", getJobById);
<<<<<<< HEAD

router.use(authenticate);
router.post("/", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);
=======
router.post("/", auth, employer, createJob as unknown as RequestHandler);
router.put("/:id", auth, employer, updateJob as unknown as RequestHandler);
router.delete("/:id", auth, employer, deleteJob as unknown as RequestHandler);
>>>>>>> main

export default router;
