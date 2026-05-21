import { Router, type RequestHandler } from "express";
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  verifyListing,
  getMyListings,
  getRoommateMatches,
  bookListing,
} from "../controllers/housing.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.get("/", getListings as unknown as RequestHandler);
router.get("/:id", getListingById as unknown as RequestHandler);

router.use(authenticate);

router.post("/", createListing as unknown as RequestHandler);
router.put("/:id", updateListing as unknown as RequestHandler);
router.delete("/:id", deleteListing as unknown as RequestHandler);
router.patch("/:id/verify", verifyListing as unknown as RequestHandler);
router.get("/host/my-listings", getMyListings as unknown as RequestHandler);
router.get(
  "/roommates/matches",
  getRoommateMatches as unknown as RequestHandler,
);
router.post("/:id/book", bookListing as unknown as RequestHandler);

export default router;
