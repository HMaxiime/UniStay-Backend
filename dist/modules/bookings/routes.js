import { Router } from "express";
import { getAllBookings, getMyBookings, getBookingById, createBooking, cancelBooking, completeBooking, getBookingsByListing, } from "../bookings/controller.js";
import { authenticate } from "../../middleware/auth.js";
const router = Router();
router.use(authenticate); // all booking routes require auth
router.get("/", getAllBookings); // ADMIN
router.get("/my", getMyBookings); // STUDENT
router.get("/:id", getBookingById); // STUDENT / HOST / ADMIN
router.post("/", createBooking); // STUDENT
router.patch("/:id/cancel", cancelBooking); // STUDENT / ADMIN
router.patch("/:id/complete", completeBooking); // HOST / ADMIN
router.get("/listing/:housing_id", getBookingsByListing); // HOST / ADMIN
export default router;
//# sourceMappingURL=routes.js.map