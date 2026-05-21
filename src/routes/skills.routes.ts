import express from "express";
import {
  createSkill,
  deleteSkill,
  getSkillById,
  getSkills,
  updateSkill,
} from "../controllers/skills.controller.js";

const router = express.Router();

router.get("/", getSkills);
router.get("/:id", getSkillById);
router.post("/", createSkill);
router.put("/:id", updateSkill);
router.delete("/:id", deleteSkill);

export default router;
