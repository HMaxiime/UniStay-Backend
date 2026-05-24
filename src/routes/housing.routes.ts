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
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

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
 
/**
 * @swagger
 * /api/listings:
 *   get:
 *     summary: List verified housing listings
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Listings list
 *   post:
 *     summary: Create listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ListingInput'
 *               - type: object
 *                 properties:
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       201:
 *         description: Listing created
 * /api/listings/me/listings:
 *   get:
 *     summary: Get authenticated host listings
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My listings
 * /api/listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing found
 *   put:
 *     summary: Update listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing updated
 *   delete:
 *     summary: Delete listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing deleted
 * /api/listings/{id}/verify:
 *   patch:
 *     summary: Verify or reject listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing verification updated
 * /api/listings/{id}/images:
 *   post:
 *     summary: Upload listing images
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded
 *   delete:
 *     summary: Delete listing image
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: imageUrl
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted
 */
router.get("/", getListings);
router.get("/:id", getListingById);

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

export default router;
