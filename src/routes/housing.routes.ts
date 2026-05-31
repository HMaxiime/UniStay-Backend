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
  optionalAuthenticate,
  authorize,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

<<<<<<< HEAD
router.get("/", getListings);
router.get("/:id", getListingById);

router.use(authenticate);

router.get("/host/my-listings", getMyListings);
router.post("/", createListing);
router.put("/:id", updateListing);
router.delete("/:id", deleteListing);
router.patch("/:id/verify", verifyListing);
=======
// Multer: store files in memory so we can pipe buffers straight to Cloudinary.
// Limits: max 10 files, 5 MB each, images only.
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

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
 
router.get("/", optionalAuthenticate, getListings);
router.get("/:id", optionalAuthenticate, getListingById);

// ─── PROTECTED ROUTES ────────────────────────────────────────────────────────
// Host: view own listings
router.get("/me/listings", authenticate, getMyListings);

// Host / Admin: create listing (up to 10 images attached at creation time)
router.post("/", authenticate, upload.array("images", 10), createListing);

// Host / Admin: update listing details + optionally add more images
router.put("/:id", authenticate, upload.array("images", 10), updateListing);

// Host / Admin: delete listing (also purges Cloudinary images)
router.delete("/:id", authenticate, deleteListing);

// Admin: verify or reject a listing
router.patch("/:id/verify", authenticate, verifyListing);

router.post("/:id/images", authenticate, upload.array("images", 10), uploadHousingImages);
router.delete("/:id/images", authenticate, deleteHousingImage);
>>>>>>> main

export default router;
