import express from "express";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  updateAssignment,
} from "../controllers/assignments.controller.js";
import { authenticate, optionalAuthenticate, requireInstructor } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/", authenticate, requireInstructor, createAssignment);
router.get("/", optionalAuthenticate, getAssignments);
router.get("/:id", optionalAuthenticate, getAssignmentById);
router.put("/:id", authenticate, requireInstructor, updateAssignment);
router.delete("/:id", authenticate, requireInstructor, deleteAssignment);

export default router;
