import { Router } from "express";
import {
  getAllBookings,
  getMyBookings,
  getBookingById,
  createBooking,
  uploadPaymentProof,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  getBookingsByListing,
} from "../controllers/booking.controller.js";
import {
  authenticate,
  requireAdmin,
  authorize,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requireAdmin,
  getAllBookings
);

router.get(
  "/my",
  authorize(["STUDENT"]),
  getMyBookings
); 

router.post(
  "/",
  authorize(["STUDENT"]),
  createBooking
); 

router.patch(
  "/:id/payment-proof",
  authorize(["STUDENT"]),
  uploadPaymentProof
); 

router.patch(
  "/:id/cancel",
  authorize(["STUDENT", "ADMIN"]),
  cancelBooking
);

router.patch(
  "/:id/confirm",
  authorize(["HOST", "ADMIN"]),
  confirmBooking
);

router.patch(
  "/:id/reject",
  authorize(["HOST", "ADMIN"]),
  rejectBooking
);

router.patch(
  "/:id/complete",
  authorize(["HOST", "ADMIN"]),
  completeBooking
); 

router.get(
  "/listing/:housing_id",
  authorize(["HOST", "ADMIN"]),
  getBookingsByListing
); // GET  /bookings/listing/:housing_id


router.get(
  "/:id",
  authorize(["STUDENT", "HOST", "ADMIN"]),
  getBookingById
); 

export default router;