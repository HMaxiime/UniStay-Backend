import express from "express";
import {
  createMaterialSkill,
  deleteMaterialSkill,
} from "../controllers/material-skills.controller.js";

const router = express.Router();

router.post("/", createMaterialSkill);
router.delete("/:id", deleteMaterialSkill);

export default router;
