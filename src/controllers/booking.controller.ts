import { prisma } from "../lib/prisma.js";
import type { Request, Response } from "express";

// ─── GET ALL BOOKINGS (Admin only) ────────────────────────────────────────────
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { status, page = "1", limit = "10" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filters: any = {};
    if (status) filters.status = String(status).toUpperCase();

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: filters,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          housing: { select: { id: true, title: true, location: true, price: true } },
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
    console.error("getAllBookings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET MY BOOKINGS (Student's own bookings) ────────────────────────────────
export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const filters: any = { userId };
    if (status) filters.status = String(status).toUpperCase();

    const bookings = await prisma.booking.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
      include: {
        housing: {
          select: {
            id: true,
            title: true,
            location: true,
            price: true,
            images: true,
            availability: true,
            host: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("getMyBookings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET SINGLE BOOKING ───────────────────────────────────────────────────────
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        housing: {
          include: {
            host: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const isOwner = booking.userId === userId;
    const isHost  = booking.housing.hostId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("getBookingById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── CREATE BOOKING (Student) ─────────────────────────────────────────────────
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { housingId, housing_id } = req.body;
    const targetHousingId: string | undefined = housingId ?? housing_id;

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
    if (listing.verificationStatus !== "VERIFIED") {
      return res.status(400).json({ success: false, message: "Listing is not yet verified" });
    }
    if (!listing.availability) {
      return res.status(400).json({ success: false, message: "Listing is not available" });
    }
    if (listing.hostId === userId) {
      return res.status(400).json({ success: false, message: "You cannot book your own listing" });
    }

    const duplicate = await prisma.booking.findFirst({
      where: {
        userId,
        housingId: targetHousingId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "You already have an active or pending booking for this listing",
      });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        housingId: targetHousingId,
        status: "PENDING",
        paymentStatus: "UNPAID",
        totalAmount: listing.price,             // snapshot price at booking time
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        housing: { select: { id: true, title: true, location: true, price: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Booking request submitted. Please upload payment proof to proceed.",
      data: booking,
    });
  } catch (error) {
    console.error("createBooking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── UPLOAD PAYMENT PROOF (Student) ──────────────────────────────────────────
// Student uploads a receipt URL after paying manually (Option B).
export const uploadPaymentProof = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const { paymentProof } = req.body; // URL to receipt image / PDF

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!paymentProof) {
      return res.status(400).json({ success: false, message: "paymentProof URL is required" });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.userId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (booking.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot upload proof for a booking with status: ${booking.status}`,
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        paymentProof,
        paymentStatus: "PENDING_VERIFICATION",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment proof submitted. Awaiting host verification.",
      data: updated,
    });
  } catch (error) {
    console.error("uploadPaymentProof error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── CONFIRM BOOKING (Host / Admin) ──────────────────────────────────────────
// Host verifies payment proof then confirms → marks listing unavailable.
export const confirmBooking = async (req: Request, res: Response) => {
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

    const isHost  = booking.housing.hostId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: "Only the host or admin can confirm a booking" });
    }
    if (booking.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm a booking with status: ${booking.status}`,
      });
    }

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
      }),
      prisma.housing.update({
        where: { id: booking.housingId },
        data: { availability: false },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Booking confirmed and listing marked as unavailable",
      data: updated,
    });
  } catch (error) {
    console.error("confirmBooking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── REJECT BOOKING (Host / Admin) ───────────────────────────────────────────
// Host declines — listing stays available, student gets notified.
export const rejectBooking = async (req: Request, res: Response) => {
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

    const isHost  = booking.housing.hostId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: "Only the host or admin can reject a booking" });
    }
    if (booking.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a booking with status: ${booking.status}`,
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return res.status(200).json({
      success: true,
      message: "Booking rejected. Listing remains available.",
      data: updated,
    });
  } catch (error) {
    console.error("rejectBooking error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
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