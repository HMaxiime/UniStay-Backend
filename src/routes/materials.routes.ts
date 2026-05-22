import express from "express";
import {
  createMaterial,
  deleteMaterial,
  getMaterialById,
  getMaterials,
  updateMaterial,
} from "../controllers/materials.controller.js";


const router = express.Router();
router.post("/", createMaterial);
router.get("/", getMaterials);
router.get("/:id", getMaterialById);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

export default router;
