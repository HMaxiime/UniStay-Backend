import prisma from "../config/prisma.js";
import type { NextFunction, Request, Response } from "express";
import { sendEmail } from "../config/email.js";
import { createNotification } from "../services/notifications.service.js";
import {
  bookingConfirmationEmail,
  bookingCancellationEmail,
} from "../templates/email.templates.js";

type AuthRequest = Request & { user?: { id?: string } }

// GET all bookings

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { fullName: true, email: true } },
          housing: { select: { title: true, location: true, images: true } },
        },
      }),
      prisma.booking.count(),
    ]);

    res.status(200).json({
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// GET booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        housing: { select: { id: true, title: true, images: true, hostId: true } },
      },
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(404).json({ message: "Booking not found" });
  }
};

// POST new booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { housingId, checkIn, checkOut } = req.body as { housingId: string; checkIn: string; checkOut: string }

    if (!housingId || !checkIn || !checkOut) return res.status(400).json({ message: 'housingId, checkIn and checkOut are required' })
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const housing = await prisma.housing.findUnique({ where: { id: housingId }, select: { id: true, title: true, price: true, hostId: true } })
    if (!housing) return res.status(404).json({ message: 'Housing not found' })

    const days = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    const totalAmount = (housing.price ?? 0) * days

    const newBooking = await prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          housingId,
          status: 'CONFIRMED',
          checkIn: { lt: new Date(checkOut) },
          checkOut: { gt: new Date(checkIn) },
        },
      })

      if (conflict) throw new Error('BOOKING_CONFLICT')

      return tx.booking.create({ data: { housingId, userId, checkIn: new Date(checkIn), checkOut: new Date(checkOut), totalAmount, status: 'PENDING' } })
    })

    await createNotification({ userId: housing.hostId, type: 'BOOKING_CREATED', title: 'New booking request', message: `A student requested to book ${housing.title}`, data: { bookingId: newBooking.id, housingId, userId } })

    res.status(201).json(newBooking)
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_CONFLICT") {
      return res.status(409).json({ message: "Booking conflict: dates are already booked" });
    }
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Error creating booking" });
  }
};

// DELETE booking
export const deleteBooking = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.status === 'CANCELLED') return res.status(400).json({ message: 'Booking is already cancelled' })

    if (booking.userId === userId) {
      const deletedBooking = await prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' }, include: { housing: { select: { id: true, title: true, hostId: true } } } })

      await createNotification({ userId: deletedBooking.housing.hostId, type: 'BOOKING_CANCELLED', title: 'Booking cancelled', message: `A student cancelled their booking for ${deletedBooking.housing.title}`, data: { bookingId: deletedBooking.id, housingId: deletedBooking.housing.id, userId: deletedBooking.userId } })

      return res.status(200).json({ message: 'Booking cancelled successfully' })
    }

    await prisma.booking.delete({ where: { id } })
    res.status(200).json({ message: 'booking deleted successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    res.status(500).json({ message: 'Error deleting booking' })
  }
};

export const changeBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    if (!["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existingBooking = await prisma.booking.findUnique({ where: { id } });
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const updatedBooking = await prisma.booking.update({ where: { id }, data: { status } })

    const Bookingdeatails = await prisma.booking.findUnique({ where: { id }, select: { id: true, checkIn: true, checkOut: true, userId: true, housing: { select: { id: true, title: true, hostId: true } }, user: { select: { email: true, fullName: true } } } })

    if (updatedBooking.status === 'CONFIRMED') {
      const emailContent = bookingConfirmationEmail(Bookingdeatails?.user.fullName || '', Bookingdeatails?.housing.title || '', Bookingdeatails?.checkIn?.toDateString() || '', Bookingdeatails?.checkOut?.toDateString() || '')
      // Notification email is best-effort: never fail the status update if it can't be sent.
      try {
        await sendEmail(Bookingdeatails?.user.email || '', 'Booking Confirmed!', emailContent)
      } catch (mailError) {
        console.error('Failed to send booking confirmation email:', mailError)
      }
      if (Bookingdeatails) await createNotification({ userId: Bookingdeatails.userId, type: 'BOOKING_CONFIRMED', title: 'Booking confirmed', message: `Your booking for ${Bookingdeatails.housing.title} was confirmed`, data: { bookingId: Bookingdeatails.id, housingId: Bookingdeatails.housing.id } })
    }

    if (updatedBooking.status === 'CANCELLED') {
      const emailContent = bookingCancellationEmail(Bookingdeatails?.user.fullName || '', Bookingdeatails?.housing.title || '', Bookingdeatails?.checkIn?.toDateString() || '', Bookingdeatails?.checkOut?.toDateString() || '', `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/housings`)
      // Notification email is best-effort: never fail the status update if it can't be sent.
      try {
        await sendEmail(Bookingdeatails?.user.email || '', 'Booking Cancelled!', emailContent)
      } catch (mailError) {
        console.error('Failed to send booking cancellation email:', mailError)
      }
      if (Bookingdeatails) await createNotification({ userId: Bookingdeatails.userId, type: 'BOOKING_CANCELLED', title: 'Booking cancelled', message: `Your booking for ${Bookingdeatails.housing.title} was cancelled`, data: { bookingId: Bookingdeatails.id, housingId: Bookingdeatails.housing.id } })
    }

    res.status(200).json({ message: 'Booking status updated successfully', updatedBooking })
  } catch (error) {
    next(error);
  }
};

// PUT update booking
export const updateBooking = async (req: Request, res: Response) => {
  const id = req.params['id'] as string
  const { checkIn, userId, totalAmount, housingId, status } = req.body
  try {
    const updatedBooking = await prisma.booking.update({ where: { id }, data: { checkIn, userId, totalAmount, housingId, status } })
    res.status(200).json({ message: 'Updating booking successfully', updatedBooking })
  } catch (error) {
    console.error('Error updating booking:', error)
    res.status(500).json({ message: 'Error updating booking' })
  }
<<<<<<< HEAD
};

// ─── CANCEL BOOKING (Student / Admin) ────────────────────────────────────────
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId  = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { housing: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const isOwner = booking.userId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (booking.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }
    if (booking.status === "COMPLETED") {
      return res.status(400).json({ success: false, message: "Cannot cancel a completed booking" });
    }

    const wasConfirmed = booking.status === "CONFIRMED";

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Restore listing availability only if it was confirmed (i.e., listing was locked)
    if (wasConfirmed) {
      await prisma.housing.update({
        where: { id: booking.housingId },
        data: { availability: true },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled",
      data: updated,
    });
  } catch (error) {
    console.error("cancelBooking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── COMPLETE BOOKING (Host / Admin) ─────────────────────────────────────────
// Host marks stay as finished → restores listing availability.
export const completeBooking = async (req: Request, res: Response) => {
  try {
    const id  = req.params.id as string;
    const userId  = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { housing: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const isHost  = booking.housing.hostId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: "Only the host or admin can complete a booking" });
    }
    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: `Cannot complete a booking with status: ${booking.status}`,
      });
    }

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "COMPLETED" },
      }),
      prisma.housing.update({
        where: { id: booking.housingId },
        data: { availability: true }, 
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Booking marked as completed. Listing is now available again.",
      data: updated,
    });
  } catch (error) {
    console.error("completeBooking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET BOOKINGS FOR A LISTING (Host / Admin) ───────────────────────────────
export const getBookingsByListing = async (req: Request, res: Response) => {
  try {
    const userId  = req.user?.id;
    const userRole = req.user?.role;
    const targetHousingId = (req.params.housingId ?? req.params.housing_id) as string | undefined;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!targetHousingId) {
      return res.status(400).json({ success: false, message: "housingId is required" });
    }

    const listing = await prisma.housing.findUnique({ where: { id: targetHousingId } });

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }
    if (userRole !== "ADMIN" && listing.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const bookings = await prisma.booking.findMany({
      where: { housingId: targetHousingId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("getBookingsByListing error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
=======
}
>>>>>>> main
