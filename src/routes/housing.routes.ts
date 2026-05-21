import { Router } from "express";
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  verifyListing,
  getMyListings,

} from "../controllers/housing.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
 
const router = Router();
 
// Public routes
router.get("/", getListings);
router.get("/:id", getListingById);
 
 
router.post("/", createListing);                         
router.put("/:id", updateListing);                        
router.delete("/:id", deleteListing);                     
router.patch("/:id/verify", verifyListing);              
               
 
export default router;
