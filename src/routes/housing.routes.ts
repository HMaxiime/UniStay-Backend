import { Router } from "express";
import multer from "multer";
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  verifyListing,
  getMyListings,
  uploadHousingImages,
  deleteHousingImage,
} from "../controllers/housing.controller.js";
import type { ErrorRequestHandler } from "express";
import {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireAdmin,
} from "../middleware/auth.middleware.js";

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

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
router.get("/", optionalAuthenticate, getListings);

// ─── PROTECTED ROUTES ────────────────────────────────────────────────────────
router.get("/me/listings", authenticate, getMyListings);

router.get("/:id", optionalAuthenticate, getListingById);
router.post("/", authenticate, upload.array("images", 10), createListing);
router.put("/:id", authenticate, upload.array("images", 10), updateListing);
router.delete("/:id", authenticate, deleteListing);
router.patch("/:id/verify", authenticate, verifyListing);
router.post("/:id/images", authenticate, upload.array("images", 10), uploadHousingImages);
router.delete("/:id/images", authenticate, deleteHousingImage);

router.use(multerError);

export default router;
