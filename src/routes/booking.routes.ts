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

// All booking routes require a valid JWT
router.use(authenticate);

// ── Admin ──────────────────────────────────────────────────────────────────
router.get(
  "/",
  requireAdmin,
  getAllBookings
); // GET  /bookings

// ── Student ────────────────────────────────────────────────────────────────
router.get(
  "/my",
  authorize(["STUDENT"]),
  getMyBookings
); // GET  /bookings/my

router.post(
  "/",
  authorize(["STUDENT"]),
  createBooking
); // POST /bookings

router.patch(
  "/:id/payment-proof",
  authorize(["STUDENT"]),
  uploadPaymentProof
); // PATCH /bookings/:id/payment-proof

router.patch(
  "/:id/cancel",
  authorize(["STUDENT", "ADMIN"]),
  cancelBooking
);

router.patch(
  "/:id/confirm",
  authorize(["HOST", "ADMIN"]),
  confirmBooking
); // PATCH /bookings/:id/confirm

router.patch(
  "/:id/reject",
  authorize(["HOST", "ADMIN"]),
  rejectBooking
);

router.patch(
  "/:id/complete",
  authorize(["HOST", "ADMIN"]),
  completeBooking
); // PATCH /bookings/:id/complete

router.get(
  "/listing/:housing_id",
  authorize(["HOST", "ADMIN"]),
  getBookingsByListing
); // GET  /bookings/listing/:housing_id

// ── Shared (owner / host / admin — checked inside controller) ─────────────
router.get(
  "/:id",
  authorize(["STUDENT", "HOST", "ADMIN"]),
  getBookingById
); // GET  /bookings/:id

export default router;