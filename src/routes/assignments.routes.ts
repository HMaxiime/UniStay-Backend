import express from "express";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  updateAssignment,
} from "../controllers/assignments.controller.js";
import { authenticate ,requireAdmin } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/",authenticate,requireAdmin, createAssignment);
router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
router.put("/:id", authenticate, requireAdmin, updateAssignment);
router.delete("/:id", authenticate, requireAdmin, deleteAssignment);

export default router;
