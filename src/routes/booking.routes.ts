import { Router, type RequestHandler } from "express";
import {
  getAllBookings,
  getMyBookings,
  getBookingById,
  createBooking,
  confirmBooking,
  rejectBooking ,
  completeBooking,
  cancelBooking,
  getBookingsByListing
  
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

router.get("/", admin, getAllBookings );

router.get("/my", student, getMyBookings );

router.post("/", student, createBooking );


router.patch("/:id/cancel", studentOrAdmin, cancelBooking );

router.patch("/:id/confirm", hostOrAdmin, confirmBooking );

router.patch("/:id/reject", hostOrAdmin, rejectBooking );

router.patch("/:id/complete", hostOrAdmin, completeBooking );

router.get("/listing/:housingId", hostOrAdmin, getBookingsByListing );

router.get("/:id", bookingViewer, getBookingById );

export default router;
