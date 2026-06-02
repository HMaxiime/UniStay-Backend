import express from "express";
import upload from "../config/multer.js";
import {
  deleteUpload,
  getUploadById,
  getUploads,
  uploadFile,
} from "../controllers/uploads.controller.js";
import { authenticate, requireInstructor } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, requireInstructor, upload.single("file"), uploadFile);
router.get("/", getUploads);
router.get("/:id", getUploadById);
router.delete("/:id", authenticate, requireInstructor, deleteUpload);

export default router;
