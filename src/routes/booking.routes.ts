import { Router, type RequestHandler } from "express";
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

const auth = authenticate as RequestHandler;
const admin = requireAdmin as RequestHandler;
const student = authorize(["STUDENT"]) as RequestHandler;
const studentOrAdmin = authorize(["STUDENT", "ADMIN"]) as RequestHandler;
const hostOrAdmin = authorize(["HOST", "ADMIN"]) as RequestHandler;
const bookingViewer = authorize(["STUDENT", "HOST", "ADMIN"]) as RequestHandler;

router.use(auth);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: List all bookings
 *     description: Admin only. Supports optional status, page, and limit query filters.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, REJECTED, COMPLETED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Bookings list
 *       403:
 *         description: Admin access required
 *   post:
 *     summary: Create a booking
 *     description: Student only. Creates a pending booking for a verified and available listing. Requires check-in and check-out dates.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *     responses:
 *       201:
 *         description: Booking request submitted
 *       400:
 *         description: Bad request
 *       409:
 *         description: Duplicate or overlapping active booking
 * /api/bookings/my:
 *   get:
 *     summary: List authenticated student's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, REJECTED, COMPLETED]
 *     responses:
 *       200:
 *         description: Student bookings list
 * /api/bookings/listing/{housingId}:
 *   get:
 *     summary: List bookings for a listing
 *     description: Host of the listing or admin only.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: housingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing bookings list
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
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
 *         description: Booking found
 *       404:
 *         description: Booking not found
 * /api/bookings/{id}/payment-proof:
 *   patch:
 *     summary: Upload payment proof URL
 *     description: Student owner only.
 *     tags: [Bookings]
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentProofInput'
 *     responses:
 *       200:
 *         description: Payment proof submitted
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel booking
 *     tags: [Bookings]
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
 *         description: Booking cancelled
 * /api/bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm booking
 *     description: Host of the listing or admin only. Payment proof must already be submitted.
 *     tags: [Bookings]
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
 *         description: Booking confirmed
 * /api/bookings/{id}/reject:
 *   patch:
 *     summary: Reject booking
 *     description: Host of the listing or admin only.
 *     tags: [Bookings]
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
 *         description: Booking rejected
 * /api/bookings/{id}/complete:
 *   patch:
 *     summary: Complete booking
 *     description: Host of the listing or admin only.
 *     tags: [Bookings]
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
 *         description: Booking completed
 */
router.get("/", admin, getAllBookings );

router.get("/my", student, getMyBookings );

router.post("/", student, createBooking );

router.patch("/:id/payment-proof", student, uploadPaymentProof );

router.patch("/:id/cancel", studentOrAdmin, cancelBooking );

router.patch("/:id/confirm", hostOrAdmin, confirmBooking );

router.patch("/:id/reject", hostOrAdmin, rejectBooking );

router.patch("/:id/complete", hostOrAdmin, completeBooking );

router.get("/listing/:housingId", hostOrAdmin, getBookingsByListing );

router.get("/:id", bookingViewer, getBookingById );

export default router;
