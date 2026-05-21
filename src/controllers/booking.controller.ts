import { prisma } from "../lib/prisma.js";
import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";

// ─── GET ALL BOOKINGS (Admin) ─────────────────────────────────────────────────
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
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
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          housing: {
            select: { id: true, title: true, location: true, price: true },
          },
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
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── GET MY BOOKINGS (Student) ────────────────────────────────────────────────
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User session not found" });
    }

    const filters: any = { userId: userId };
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
            host: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("getMyBookings error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── GET SINGLE BOOKING ───────────────────────────────────────────────────────
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: String(id) },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        housing: {
          include: {
            host: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Students can only view their own bookings; hosts can view bookings on their listings
    const isOwner = booking.userId === userId;
    const isHost = booking.housing.hostId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("getBookingById error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── CREATE BOOKING (Student) ─────────────────────────────────────────────────
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { housing_id, housingId } = req.body;

    const targetHousingId = housingId || housing_id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User session not found" });
    }

    if (!targetHousingId) {
      return res
        .status(400)
        .json({ success: false, message: "housingId is required" });
    }

    const listing = await prisma.housing.findUnique({
      where: { id: String(targetHousingId) },
    });

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    if (listing.verificationStatus !== "VERIFIED") {
      return res
        .status(400)
        .json({ success: false, message: "Listing is not verified" });
    }

    if (!listing.availability) {
      return res
        .status(400)
        .json({ success: false, message: "Listing is not available" });
    }

    // Prevent a host from booking their own listing
    if (listing.hostId === userId) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot book your own listing" });
    }

    // Prevent duplicate active booking on the same listing
    const duplicate = await prisma.booking.findFirst({
      where: {
        userId: userId,
        housingId: String(targetHousingId),
        status: "CONFIRMED",
      },
    });

    if (duplicate) {
      return res
        .status(409)
        .json({
          success: false,
          message: "You already have an active booking for this listing",
        });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        housingId: String(targetHousingId),
        status: "CONFIRMED",
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days check-out per schema requirements
      },
      include: {
        housing: {
          select: { id: true, title: true, location: true, price: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    console.error("createBooking error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── CANCEL BOOKING (Student / Admin) ────────────────────────────────────────
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: String(id) },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const isOwner = booking.userId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (booking.status === "CANCELLED") {
      return res
        .status(400)
        .json({ success: false, message: "Booking is already cancelled" });
    }

    const updated = await prisma.booking.update({
      where: { id: String(id) },
      data: { status: "CANCELLED" },
    });

    return res.status(200).json({
      success: true,
      message: "Booking cancelled",
      data: updated,
    });
  } catch (error) {
    console.error("cancelBooking error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── COMPLETE BOOKING (Host / Admin) ─────────────────────────────────────────
export const completeBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: String(id) },
      include: { housing: true },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const isHost = booking.housing.hostId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isHost && !isAdmin) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only the host or admin can complete a booking",
        });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm a booking that is not pending. Current status: ${booking.status}`,
      });
    }

    const updated = await prisma.booking.update({
      where: { id: String(id) },
      data: { status: "CONFIRMED" },
    });

    // Mark listing as unavailable once booking is confirmed
    await prisma.housing.update({
      where: { id: booking.housingId },
      data: { availability: false },
    });

    return res.status(200).json({
      success: true,
      message: "Booking confirmed",
      data: updated,
    });
  } catch (error) {
    console.error("completeBooking error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── GET BOOKINGS FOR A LISTING (Host / Admin) ────────────────────────────────
export const getBookingsByListing = async (req: AuthRequest, res: Response) => {
  try {
    const { housing_id, housingId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const targetHousingId = housingId || housing_id;

    if (!targetHousingId) {
      return res
        .status(400)
        .json({ success: false, message: "housingId is required" });
    }

    const listing = await prisma.housing.findUnique({
      where: { id: String(targetHousingId) },
    });

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    if (userRole !== "ADMIN" && listing.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const bookings = await prisma.booking.findMany({
      where: { housingId: String(targetHousingId) },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("getBookingsByListing error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
