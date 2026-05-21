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
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router();

router.get("/", getListings);
router.get("/:id", getListingById);

router.use(authenticate as unknown as RequestHandler);

router.post("/", createListing);
router.put("/:id", updateListing);
router.delete("/:id", deleteListing);
router.patch("/:id/verify", verifyListing);
router.get("/host/my-listings", getMyListings);
router.get("/roommates/matches", getRoommateMatches);
router.post("/:id/book", bookListing);

export default router;