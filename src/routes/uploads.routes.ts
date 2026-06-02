import express from "express";
import upload, { avatarUpload } from "../config/multer.js";
import {
  deleteUpload,
  getUploadById,
  getUploads,
  uploadAvatar,
  updateAvatar,
  deleteAvatar,
  uploadCourseThumbnail,
  uploadFile,
} from "../controllers/uploads.controller.js";
import { authenticate, requireInstructor } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, requireInstructor, upload.single("file"), uploadFile);
router.post("/course-thumbnail", authenticate, requireInstructor, upload.single("file"), uploadCourseThumbnail);
router.post("/avatar", authenticate, avatarUpload.single("file"), uploadAvatar);
router.put("/avatar", authenticate, avatarUpload.single("file"), updateAvatar);
router.delete("/avatar", authenticate, deleteAvatar);
router.get("/", getUploads);
router.get("/:id", getUploadById);
router.delete("/:id", authenticate, requireInstructor, deleteUpload);

export default router;
