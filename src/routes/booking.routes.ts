import express, { type RequestHandler } from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByListing,
  updateBooking,
  changeBookingStatus,
  cancelBooking,
  completeBooking,
  deleteBooking,
} from "../controllers/booking.controller.js";
import {
  authenticate,
  requireStudent,
  requireHost,
  requireAdmin,
  authorize,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate as RequestHandler);

// ─── STUDENT ──────────────────────────────────────────────────────────────────
router.get("/my",              authorize(["STUDENT"]) as RequestHandler,           getBookingById as RequestHandler);
router.post("/",               requireStudent as RequestHandler,                    createBooking as RequestHandler);
router.patch("/:id/cancel",    authorize(["STUDENT", "ADMIN"]) as RequestHandler,  cancelBooking as RequestHandler);

// ─── HOST / ADMIN ─────────────────────────────────────────────────────────────
router.get("/listing/:housing_id", authorize(["HOST", "ADMIN"]) as RequestHandler, getBookingsByListing as RequestHandler);
router.patch("/:id/complete",  authorize(["HOST", "ADMIN"]) as RequestHandler,     completeBooking as RequestHandler);
router.put("/approve/:id",     requireHost as RequestHandler,                       changeBookingStatus as RequestHandler);

// ─── ADMIN ────────────────────────────────────────────────────────────────────
router.get("/",                requireAdmin as RequestHandler,                      getAllBookings as RequestHandler);
router.delete("/:id",          requireAdmin as RequestHandler,                      deleteBooking as RequestHandler);

// ─── SHARED ───────────────────────────────────────────────────────────────────
router.get("/:id",             authorize(["STUDENT", "HOST", "ADMIN"]) as RequestHandler, getBookingById as RequestHandler);
router.put("/:id",             requireStudent as RequestHandler,                    updateBooking as RequestHandler);

export default router;
