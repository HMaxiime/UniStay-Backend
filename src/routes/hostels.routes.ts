import { Router } from "express";
import multer from "multer";
import {
  getHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
  verifyHostel,
  getMyHostels,
} from "../controllers/hostels.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", optionalAuthenticate, getHostels);
router.get("/me/hostels", authenticate, getMyHostels);
router.get("/:id", optionalAuthenticate, getHostelById);
router.post("/", authenticate, upload.array("images", 10), createHostel);
router.put("/:id", authenticate, upload.array("images", 10), updateHostel);
router.delete("/:id", authenticate, deleteHostel);
router.patch("/:id/verify", authenticate, verifyHostel);

export default router;
