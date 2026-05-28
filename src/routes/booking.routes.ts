import express, { type RequestHandler } from "express";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  changeBookingStatus,
} from "../controllers/booking.controller.js";
import { authenticate, requireStudent, requireHost } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate as RequestHandler  , getAllBookings);
router.get("/:id", authenticate as RequestHandler , requireStudent as RequestHandler , getBookingById);
router.post("/",authenticate as RequestHandler , requireStudent as RequestHandler , createBooking);
router.delete("/:id", authenticate as RequestHandler , requireStudent as RequestHandler , deleteBooking);
router.put("/approve/:id", authenticate as RequestHandler  , requireHost as RequestHandler , changeBookingStatus);
router.put("/:id", authenticate as RequestHandler , requireStudent as RequestHandler , updateBooking);

export default router;