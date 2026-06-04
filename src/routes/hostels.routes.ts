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
import type { ErrorRequestHandler } from "express";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";

const router = Router();

const multerError: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Each image must be 10 MB or smaller" });
  }
  next(err);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
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

router.use(multerError);

export default router;
