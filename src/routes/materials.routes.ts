import express, { type RequestHandler } from "express";
import {
  createMaterial,
  deleteMaterial,
  getMaterialById,
  getMaterials,
  updateMaterial,
} from "../controllers/materials.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";


const router = express.Router();
const auth = authenticate as RequestHandler;

router.post("/course/:courseId", auth, createMaterial);
router.get("/", getMaterials);
router.get("/:id", getMaterialById);
router.put("/:id", auth, updateMaterial);
router.delete("/:id", auth, deleteMaterial);

export default router;
