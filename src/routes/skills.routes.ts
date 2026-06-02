import express from "express";
import {
  createSkill,
  deleteSkill,
  getSkillById,
  getSkills,
  updateSkill,
} from "../controllers/skills.controller.js";
import { authenticate, requireInstructor } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getSkills);
router.get("/:id", getSkillById);
router.post("/", authenticate, requireInstructor, createSkill);
router.put("/:id", authenticate, requireInstructor, updateSkill);
router.delete("/:id", authenticate, requireInstructor, deleteSkill);

export default router;
