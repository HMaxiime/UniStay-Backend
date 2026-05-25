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
import {
  authenticate,
  authorize,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

// ─── Multer: memory storage, images only, 5 MB per file, 10 files max ────────
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

// ─── PUBLIC ROUTES (no auth needed) ──────────────────────────────────────────
router.get("/", getListings);
router.get("/:id", getListingById);

// ─── ALL ROUTES BELOW REQUIRE AUTH ───────────────────────────────────────────
router.use(authenticate);

// IMPORTANT: /me must come before /:id or Express matches "me" as an id param
router.get("/me/listings", authorize(["HOST", "ADMIN"]), getMyListings);

// Host / Admin: create listing (images optional via multipart/form-data)
router.post(
  "/",
  authorize(["HOST", "ADMIN"]),
  upload.array("images", 10),
  createListing
);

// Host / Admin: update listing + optionally add more images
router.put(
  "/:id",
  authorize(["HOST", "ADMIN"]),
  upload.array("images", 10),
  updateListing
);

// Host / Admin: delete listing 
router.delete("/:id", authorize(["HOST", "ADMIN"]), deleteListing);

// Admin only: verify or reject a listing
router.patch("/:id/verify", requireAdmin, verifyListing);

router.post(
  "/:id/images",
  authorize(["HOST", "ADMIN"]),
  upload.array("images", 10),
  uploadHousingImages
);
router.delete(
  "/:id/images",
  authorize(["HOST", "ADMIN"]),
  deleteHousingImage
);

export default router;