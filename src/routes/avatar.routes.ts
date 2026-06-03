import express from "express";
import { avatarUpload } from "../config/multer.js";
import {
  uploadAvatar,
  updateAvatar,
  deleteAvatar,
} from "../controllers/uploads.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, avatarUpload.single("file"), uploadAvatar);
router.put("/", authenticate, avatarUpload.single("file"), updateAvatar);
router.delete("/", authenticate, deleteAvatar);

export default router;
