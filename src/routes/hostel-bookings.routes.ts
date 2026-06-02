import { Router } from "express";
import {
  createBooking,
  payBooking,
  cancelBooking,
  getBookings,
  getBookingById,
  changeBookingStatus,
  getWaitingList,
  getHostelReports,
  getPlatformReports,
} from "../controllers/hostel-bookings.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getBookings);
router.get("/waiting-list", authenticate, getWaitingList);
router.get("/reports/platform", authenticate, getPlatformReports);
router.get("/reports/hostel/:hostelId", authenticate, getHostelReports);
router.get("/:id", authenticate, getBookingById);
router.post("/", authenticate, createBooking);
router.post("/:id/pay", authenticate, payBooking);
router.post("/:id/cancel", authenticate, cancelBooking);
router.patch("/:id/status", authenticate, changeBookingStatus);

export default router;
