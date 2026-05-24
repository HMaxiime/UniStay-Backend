import express from "express";
import upload from "../config/multer.js";
import {
  deleteUpload,
  getUploadById,
  getUploads,
  uploadFile,
} from "../controllers/uploads.controller.js";

const router = express.Router();

router.post("/", upload.single("file"), uploadFile);
router.get("/", getUploads);
router.get("/:id", getUploadById);
router.delete("/:id", deleteUpload);

export default router;
