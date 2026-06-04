import { prisma } from "../lib/prisma.js";
import type { Request, Response } from "express";
import stripe from "../config/stripe.js";
import { createNotification } from "../services/notifications.service.js";

// Helper to log audit actions
const logActivity = async (userId: string | undefined, action: string, details: string) => {
  try {
    let email: string | undefined = undefined;
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      email = u?.email;
    }
    await prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        userEmail: email ?? null,
        action,
        details,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

// ─── WAITING LIST PROMOTION TRIGGER ──────────────────────────────────────────
// Promotes the first waitlisted student for a room when a confirmed booking is cancelled.
export const promoteFromWaitingList = async (roomId: string, tx: any) => {
  // Find first waitlisted booking for this room (smallest queuePosition or earliest createdAt)
  const nextBooking = await tx.booking.findFirst({
    where: {
      roomId,
      status: "WAITLISTED",
    },
    orderBy: [
      { queuePosition: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      user: { select: { fullName: true, email: true } },
      room: { select: { name: true, hostelId: true, hostel: { select: { name: true } } } },
    },
  });

  if (!nextBooking) {
    return; // No waitlisted students to promote
  }

  const oldQueuePos = nextBooking.queuePosition;

  // Promote this student to CONFIRMED
  await tx.booking.update({
    where: { id: nextBooking.id },
    data: {
      status: "CONFIRMED",
      queuePosition: null,
    },
  });

  // Decrease available beds for the room (since a confirmed slot is taken)
  await tx.room.update({
    where: { id: roomId },
    data: {
      availableBeds: { decrement: 1 },
    },
  });

  // Shift queuePosition of all remaining waitlisted bookings for this room
  if (oldQueuePos !== null) {
    await tx.booking.updateMany({
      where: {
        roomId,
        status: "WAITLISTED",
        queuePosition: { gt: oldQueuePos },
      },
      data: {
        queuePosition: { decrement: 1 },
      },
    });
  }

  // Create notifications and log activity
  await createNotification({
    userId: nextBooking.userId,
    type: "BOOKING_PROMOTED",
    title: "Accommodation Confirmed!",
    message: `Congratulations! You have been promoted from the waiting list. Your booking for ${nextBooking.room.hostel.name} - Room ${nextBooking.room.name} is now CONFIRMED.`,
    data: { bookingId: nextBooking.id, roomId },
  });

  await prisma.activityLog.create({
    data: {
      userId: nextBooking.userId,
      userEmail: nextBooking.user.email,
      action: "WAITLIST_PROMOTION",
      details: `Student ${nextBooking.user.fullName} promoted from waitlist to CONFIRMED for room ${nextBooking.room.name} (${roomId})`,
    },
  });
};

// ─── CREATE BOOKING (Accommodation Application) ──────────────────────────────
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user?.role !== "STUDENT") {
      return res.status(403).json({ success: false, message: "Only students can submit accommodation applications" });
    }

    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ success: false, message: "roomId is required" });
    }

    let room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hostel: true },
    });

    if (!room) {
      const hostel = await prisma.hostel.findUnique({ where: { id: roomId } });
      if (hostel) {
        room = await prisma.room.findFirst({
          where: { hostelId: roomId, availableBeds: { gt: 0 } },
          include: { hostel: true },
        }) ?? await prisma.room.findFirst({
          where: { hostelId: roomId },
          include: { hostel: true },
        });
      }
    }

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (room.hostel.verificationStatus !== "VERIFIED") {
      return res.status(400).json({ success: false, message: "Hostel must be verified before booking" });
    }

    // Check if user already has an active booking (non-cancelled, non-rejected)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: {
          in: ["PENDING", "PAYMENT_PENDING", "PAID", "CONFIRMED", "WAITLISTED"],
        },
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "You already have an active hostel booking or pending application.",
        data: existingBooking,
      });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        status: "PENDING",
        paymentStatus: "PENDING",
        totalAmount: room.price,
      },
    });

    await logActivity(userId, "APPLICATION_SUBMITTED", `Submitted accommodation application for room ${room.name} (${roomId})`);

    // Notify Host
    await createNotification({
      userId: room.hostel.hostId,
      type: "APPLICATION_CREATED",
      title: "New Accommodation Application",
      message: `A student submitted an application for room ${room.name} in ${room.hostel.name}`,
      data: { bookingId: booking.id, roomId, studentId: userId },
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully. Please proceed to payment.",
      data: booking,
    });
  } catch (error) {
    console.error("createBooking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── PAY FOR ACCOMMODATION (Proceed to Payment) ──────────────────────────────
export const payBooking = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: { include: { hostel: true } },
        user: { select: { fullName: true, email: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking application not found" });
    }

    if (booking.userId !== userId && req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    if (booking.status !== "PENDING" && booking.status !== "PAYMENT_PENDING") {
      return res.status(400).json({ success: false, message: `Payment cannot be processed for status: ${booking.status}` });
    }

    const successUrl = process.env["STRIPE_SUCCESS_URL"] ?? `${process.env["FRONTEND_URL"] ?? "http://localhost:3000"}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = process.env["STRIPE_CANCEL_URL"] ?? `${process.env["FRONTEND_URL"] ?? "http://localhost:3000"}/payment-cancelled?session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: booking.user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Accommodation for ${booking.room.name}`,
              description: `Room ${booking.room.name} in ${booking.room.hostel.name}`,
            },
            unit_amount: Math.round((booking.totalAmount ?? 0) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        bookingId: booking.id,
        roomId: booking.room.id,
        userId: booking.userId,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: "PENDING",
        stripeCheckoutSessionId: session.id,
      },
    });

    await logActivity(userId, "PAYMENT_SESSION_CREATED", `Created Stripe checkout session for booking ${id}`);

    return res.status(200).json({
      success: true,
      message: "Stripe checkout session created successfully",
      data: { checkoutUrl: session.url, sessionId: session.id },
    });
  } catch (error) {
    console.error("payBooking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── CANCEL BOOKING ──────────────────────────────────────────────────────────
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: { include: { hostel: true } } },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Allowed: Owner of booking, Hostel Host, Admin
    const isOwner = booking.userId === userId;
    const isHost = userRole === "HOST" && booking.room.hostel.hostId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: You cannot cancel this booking" });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    const oldStatus = booking.status;
    const oldQueuePos = booking.queuePosition;

    // Use transaction to ensure thread-safe queue updates and promotions
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Cancel the booking
      const cb = await tx.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          queuePosition: null,
        },
      });

      // 2. Adjust available beds and trigger waitlist promotion if cancelled was CONFIRMED
      if (oldStatus === "CONFIRMED") {
        await tx.room.update({
          where: { id: booking.roomId },
          data: {
            availableBeds: { increment: 1 },
          },
        });

        // Trigger automatic promotion
        await promoteFromWaitingList(booking.roomId, tx);
      }

      // 3. Re-adjust waiting list positions if cancelled was WAITLISTED
      if (oldStatus === "WAITLISTED" && oldQueuePos !== null) {
        await tx.booking.updateMany({
          where: {
            roomId: booking.roomId,
            status: "WAITLISTED",
            queuePosition: { gt: oldQueuePos },
          },
          data: {
            queuePosition: { decrement: 1 },
          },
        });
      }

      return cb;
    });

    await logActivity(userId, "BOOKING_CANCELLED", `Cancelled booking ${id} (Previous status: ${oldStatus})`);

    // Notify Student if host/admin cancelled it
    if (!isOwner) {
      await createNotification({
        userId: booking.userId,
        type: "BOOKING_CANCELLED_BY_STAFF",
        title: "Booking Cancelled",
        message: `Your booking for ${booking.room.hostel.name} has been cancelled by the platform support.`,
        data: { bookingId: id },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: updated,
    });
  } catch (error) {
    console.error("cancelBooking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET ALL BOOKINGS ────────────────────────────────────────────────────────
export const getBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { status, roomId, hostelId, page = "1", limit = "10" } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const filters: any = {};

    if (status) {
      filters.status = String(status);
    }
    if (roomId) {
      filters.roomId = String(roomId);
    }

    // Role-based filtering
    if (userRole === "STUDENT") {
      filters.userId = userId;
    } else if (userRole === "HOST") {
      // Hosts see bookings for their hostels
      filters.room = {
        hostel: {
          hostId: userId,
          ...(hostelId && { id: String(hostelId) }),
        },
      };
    } else if (userRole === "ADMIN") {
      if (hostelId) {
        filters.room = {
          hostelId: String(hostelId),
        };
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: filters,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          room: {
            include: { hostel: { select: { id: true, name: true, location: true } } },
          },
          refundRequest: true,
        },
      }),
      prisma.booking.count({ where: filters }),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getBookings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET SINGLE BOOKING BY ID ────────────────────────────────────────────────
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        room: { include: { hostel: true } },
        refundRequest: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Authorization checks
    const isOwner = booking.userId === userId;
    const isHost = userRole === "HOST" && booking.room.hostel.hostId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("getBookingById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── CHANGE BOOKING STATUS MANUALLY (Host/Admin only) ──────────────────────────
export const changeBookingStatus = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { status } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (userRole !== "HOST" && userRole !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only hosts and admins can change booking statuses manually" });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: { include: { hostel: true } } },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (userRole === "HOST" && booking.room.hostel.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this hostel" });
    }

    const oldStatus = booking.status;
    const oldQueuePos = booking.queuePosition;

    if (oldStatus === status) {
      return res.status(200).json({ success: true, message: "Status is already set to target value", data: booking });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update the booking status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status,
          queuePosition: status === "WAITLISTED" ? booking.queuePosition : null,
        },
      });

      // 2. Decrement beds if transitioning to CONFIRMED
      if (status === "CONFIRMED" && oldStatus !== "CONFIRMED") {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { availableBeds: { decrement: 1 } },
        });

        // Shift waitlist positions if it was waitlisted
        if (oldStatus === "WAITLISTED" && oldQueuePos !== null) {
          await tx.booking.updateMany({
            where: {
              roomId: booking.roomId,
              status: "WAITLISTED",
              queuePosition: { gt: oldQueuePos },
            },
            data: { queuePosition: { decrement: 1 } },
          });
        }
      }

      // 3. Increment beds and promote if transitioning away from CONFIRMED
      if (oldStatus === "CONFIRMED" && status !== "CONFIRMED") {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { availableBeds: { increment: 1 } },
        });

        await promoteFromWaitingList(booking.roomId, tx);
      }

      // 4. Update waitlist shifts if transitioning away from WAITLISTED (not to CONFIRMED)
      if (oldStatus === "WAITLISTED" && status !== "CONFIRMED" && oldQueuePos !== null) {
        await tx.booking.updateMany({
          where: {
            roomId: booking.roomId,
            status: "WAITLISTED",
            queuePosition: { gt: oldQueuePos },
          },
          data: { queuePosition: { decrement: 1 } },
        });
      }

      return updatedBooking;
    });

    await logActivity(userId, "STATUS_MANUALLY_CHANGED", `Changed booking ${id} status from ${oldStatus} to ${status}`);

    // Send status notification
    await createNotification({
      userId: booking.userId,
      type: "BOOKING_STATUS_CHANGED",
      title: "Booking Status Updated",
      message: `Your booking status for room ${booking.room.name} in ${booking.room.hostel.name} has been updated to ${status}.`,
      data: { bookingId: id, status },
    });

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("changeBookingStatus error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET WAITING LIST FOR A ROOM ──────────────────────────────────────────────
export const getWaitingList = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ success: false, message: "roomId query parameter is required" });
    }

    const waitlist = await prisma.booking.findMany({
      where: {
        roomId: String(roomId),
        status: "WAITLISTED",
      },
      orderBy: { queuePosition: "asc" },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    return res.status(200).json({ success: true, data: waitlist });
  } catch (error) {
    console.error("getWaitingList error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GENERATE HOSTEL-SPECIFIC REPORTS ─────────────────────────────────────────
export const getHostelReports = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const userRole = req.user?.role;
    const rawHostelId = req.params.hostelId;
    const hostelId = Array.isArray(rawHostelId) ? rawHostelId[0] : rawHostelId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: { rooms: { include: { bookings: true } } },
    });

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    if (userRole !== "ADMIN" && hostel.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    // Calculations
    let totalCapacity = 0;
    let totalAvailableBeds = 0;
    let totalRooms = hostel.rooms.length;
    let categoryCounts: Record<string, number> = { VIP: 0, STANDARD: 0, BUDGET: 0 };
    let bookingsCount: Record<string, number> = {
      PENDING: 0,
      PAYMENT_PENDING: 0,
      PAID: 0,
      CONFIRMED: 0,
      WAITLISTED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };
    let totalPayments = 0;

    for (const room of hostel.rooms) {
      totalCapacity += room.capacity;
      totalAvailableBeds += room.availableBeds;
      categoryCounts[room.category] = (categoryCounts[room.category] || 0) + 1;

      for (const booking of room.bookings) {
        bookingsCount[booking.status] = (bookingsCount[booking.status] || 0) + 1;
        if (booking.paymentStatus === "PAID") {
          totalPayments += booking.totalAmount || 0;
        }
      }
    }

    const occupancyRate = totalCapacity > 0 ? ((totalCapacity - totalAvailableBeds) / totalCapacity) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        hostelId,
        hostelName: hostel.name,
        totalRooms,
        totalCapacity,
        occupiedBeds: totalCapacity - totalAvailableBeds,
        availableBeds: totalAvailableBeds,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        roomCategoryDistribution: categoryCounts,
        bookingsStatusDistribution: bookingsCount,
        totalRevenue: totalPayments,
      },
    });
  } catch (error) {
    console.error("getHostelReports error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GENERATE PLATFORM-WIDE REPORTS (Admin only) ──────────────────────────────
export const getPlatformReports = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const hostels = await prisma.hostel.findMany({
      include: { rooms: { include: { bookings: true } } },
    });

    let totalHostels = hostels.length;
    let totalRooms = 0;
    let totalCapacity = 0;
    let totalAvailableBeds = 0;
    let totalRevenue = 0;
    let bookingsCount: Record<string, number> = {
      PENDING: 0,
      PAYMENT_PENDING: 0,
      PAID: 0,
      CONFIRMED: 0,
      WAITLISTED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };

    for (const hostel of hostels) {
      totalRooms += hostel.rooms.length;
      for (const room of hostel.rooms) {
        totalCapacity += room.capacity;
        totalAvailableBeds += room.availableBeds;

        for (const booking of room.bookings) {
          bookingsCount[booking.status] = (bookingsCount[booking.status] || 0) + 1;
          if (booking.paymentStatus === "PAID") {
            totalRevenue += booking.totalAmount || 0;
          }
        }
      }
    }

    const overallOccupancyRate = totalCapacity > 0 ? ((totalCapacity - totalAvailableBeds) / totalCapacity) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalHostels,
        totalRooms,
        totalCapacity,
        occupiedBeds: totalCapacity - totalAvailableBeds,
        availableBeds: totalAvailableBeds,
        occupancyRate: Math.round(overallOccupancyRate * 100) / 100,
        bookingsStatusDistribution: bookingsCount,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("getPlatformReports error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
