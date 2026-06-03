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
          room: { include: { hostel: { select: { id: true, name: true, location: true } } } },
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
        room: { include: { hostel: { select: { id: true, name: true, location: true, hostId: true } } } },
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
    const { roomId, checkIn, checkOut } = req.body as { roomId: string; checkIn: string; checkOut: string }

    if (!roomId || !checkIn || !checkOut) return res.status(400).json({ message: 'roomId, checkIn and checkOut are required' })
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true, price: true, hostel: { select: { id: true, name: true, hostId: true } } },
    })
    if (!room) return res.status(404).json({ message: 'Room not found' })

    const days = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    const totalAmount = (room.price ?? 0) * days

    const newBooking = await prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          roomId,
          status: 'CONFIRMED',
          checkIn: { lt: new Date(checkOut) },
          checkOut: { gt: new Date(checkIn) },
        },
      })

      if (conflict) throw new Error('BOOKING_CONFLICT')

      return tx.booking.create({ data: { roomId, userId, checkIn: new Date(checkIn), checkOut: new Date(checkOut), totalAmount, status: 'PENDING' } })
    })

    await createNotification({ userId: room.hostel.hostId, type: 'BOOKING_CREATED', title: 'New booking request', message: `A student requested to book room ${room.name}`, data: { bookingId: newBooking.id, roomId, userId } })

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
      const deletedBooking = await prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' }, include: { room: { include: { hostel: { select: { id: true, name: true, hostId: true } } } } } })

      await createNotification({ userId: deletedBooking.room.hostel.hostId, type: 'BOOKING_CANCELLED', title: 'Booking cancelled', message: `A student cancelled their booking for ${deletedBooking.room.name}`, data: { bookingId: deletedBooking.id, roomId: deletedBooking.room.id, userId: deletedBooking.userId } })

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
    const id = req.params.id as string;
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

    const bookingDetails = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        userId: true,
        room: { select: { id: true, name: true, hostel: { select: { id: true, name: true } } } },
        user: { select: { email: true, fullName: true } },
      },
    })

    if (updatedBooking.status === 'CONFIRMED') {
      const emailContent = bookingConfirmationEmail(
        bookingDetails?.user.fullName || '',
        bookingDetails?.room.name || '',
        bookingDetails?.checkIn?.toDateString() || '',
        bookingDetails?.checkOut?.toDateString() || '',
      )
      try {
        await sendEmail(bookingDetails?.user.email || '', 'Booking Confirmed!', emailContent)
      } catch (mailError) {
        console.error('Failed to send booking confirmation email:', mailError)
      }
      if (bookingDetails) {
        await createNotification({
          userId: bookingDetails.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking confirmed',
          message: `Your booking for ${bookingDetails.room.name} was confirmed`,
          data: { bookingId: bookingDetails.id, roomId: bookingDetails.room.id },
        })
      }
    }

    if (updatedBooking.status === 'CANCELLED') {
      const emailContent = bookingCancellationEmail(
        bookingDetails?.user.fullName || '',
        bookingDetails?.room.name || '',
        bookingDetails?.checkIn?.toDateString() || '',
        bookingDetails?.checkOut?.toDateString() || '',
        `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/rooms`,
      )
      try {
        await sendEmail(bookingDetails?.user.email || '', 'Booking Cancelled!', emailContent)
      } catch (mailError) {
        console.error('Failed to send booking cancellation email:', mailError)
      }
      if (bookingDetails) {
        await createNotification({
          userId: bookingDetails.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking cancelled',
          message: `Your booking for ${bookingDetails.room.name} was cancelled`,
          data: { bookingId: bookingDetails.id, roomId: bookingDetails.room.id },
        })
      }
    }

    res.status(200).json({ message: 'Booking status updated successfully', updatedBooking })
  } catch (error) {
    next(error);
  }
};

// PUT update booking
export const updateBooking = async (req: Request, res: Response) => {
  const id = req.params['id'] as string
  const { checkIn, userId, totalAmount, roomId, status } = req.body
  try {
    const updatedBooking = await prisma.booking.update({ where: { id }, data: { checkIn, userId, totalAmount, roomId, status } })
    res.status(200).json({ message: 'Updating booking successfully', updatedBooking })
  } catch (error) {
    console.error('Error updating booking:', error)
    res.status(500).json({ message: 'Error updating booking' })
  }
};

