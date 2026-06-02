import express, { type RequestHandler } from "express";
import {
  createMaterial,
  deleteMaterial,
  getMaterialById,
  getMaterials,
  updateMaterial,
} from "../controllers/materials.controller.js";

import { authenticate, optionalAuthenticate, requireInstructor } from "../middleware/auth.middleware.js";


const router = express.Router();
const auth = authenticate as RequestHandler;

router.post("/course/:courseId", auth, requireInstructor, createMaterial);
router.get("/", optionalAuthenticate, getMaterials);
router.get("/:id", optionalAuthenticate, getMaterialById);
router.put("/:id", auth, requireInstructor, updateMaterial);
router.delete("/:id", auth, requireInstructor, deleteMaterial);

export default router;
