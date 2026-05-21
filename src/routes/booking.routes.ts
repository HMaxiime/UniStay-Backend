import { Router, type RequestHandler } from "express";

import {
  cancelBooking,
  completeBooking,
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByListing,
  getMyBookings,
} from "../controllers/booking.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getAllBookings as unknown as RequestHandler);
router.get("/my", getMyBookings as unknown as RequestHandler);
router.get("/:id", getBookingById as unknown as RequestHandler);
router.post("/", createBooking as unknown as RequestHandler);
router.patch("/:id/cancel", cancelBooking as unknown as RequestHandler);
router.patch("/:id/complete", completeBooking as unknown as RequestHandler);
router.get(
  "/listing/:housing_id",
  getBookingsByListing as unknown as RequestHandler,
);

export default router;
