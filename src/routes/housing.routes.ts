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

/**
 * swagger
 * /api/housings:
 * get:
 * summary: Get all housing listings
 * tags: Housings
 * responses:
 * 200:
 * description: List of hosuing listings retrieved successfully
*/
router.get("/", getListings);
/**
 * swagger
 * /api/housings/{id}:
 * get:
 * summary: Get a housing listing by Id
 * 201:
 * description: Housing listing retrieved successfully
*/
router.get("/:id", getListingById);

router.use(authenticate);

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
