import {} from "express";
import { prisma } from "../../lib/prisma.js";
import { BookingStatus, Role } from "@prisma/client";
// ─── GET ALL BOOKINGS (Admin) ─────────────────────────────────────────────────
export const getAllBookings = async (req, res) => {
    try {
        if (req.user?.role !== Role.ADMIN) {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const { status, page = "1", limit = "10" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status) {
            const upper = String(status).toUpperCase();
            if (Object.values(BookingStatus).includes(upper)) {
                where.status = upper;
            }
        }
        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { created_at: "desc" },
                include: {
                    user: {
                        select: { id: true, full_name: true, email: true, phone: true },
                    },
                    housing: {
                        select: { id: true, title: true, location: true, price: true },
                    },
                },
            }),
            prisma.booking.count({ where }),
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
    }
    catch (error) {
        console.error("getAllBookings error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── GET MY BOOKINGS (Student) ────────────────────────────────────────────────
export const getMyBookings = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status } = req.query;
        const where = { user_id: userId };
        if (status) {
            const upper = String(status).toUpperCase();
            if (Object.values(BookingStatus).includes(upper)) {
                where.status = upper;
            }
        }
        const bookings = await prisma.booking.findMany({
            where,
            orderBy: { created_at: "desc" },
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
                            select: { id: true, full_name: true, email: true, phone: true },
                        },
                    },
                },
            },
        });
        return res.status(200).json({ success: true, data: bookings });
    }
    catch (error) {
        console.error("getMyBookings error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── GET SINGLE BOOKING ───────────────────────────────────────────────────────
export const getBookingById = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, full_name: true, email: true, phone: true },
                },
                housing: {
                    include: {
                        host: {
                            select: { id: true, full_name: true, email: true, phone: true },
                        },
                    },
                },
            },
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const isOwner = booking.user_id === userId;
        const isHost = booking.housing.host.id === userId; // use included host.id, not host_id
        const isAdmin = userRole === Role.ADMIN;
        if (!isOwner && !isHost && !isAdmin) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        return res.status(200).json({ success: true, data: booking });
    }
    catch (error) {
        console.error("getBookingById error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── CREATE BOOKING (Student) ─────────────────────────────────────────────────
export const createBooking = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { housing_id } = req.body;
        if (!housing_id) {
            return res.status(400).json({ success: false, message: "housing_id is required" });
        }
        const listing = await prisma.housing.findUnique({ where: { id: housing_id } });
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }
        if (listing.verification_status !== "VERIFIED") {
            return res.status(400).json({ success: false, message: "Listing is not verified" });
        }
        if (!listing.availability) {
            return res.status(400).json({ success: false, message: "Listing is not available" });
        }
        if (listing.host_id === userId) {
            return res.status(400).json({ success: false, message: "You cannot book your own listing" });
        }
        const duplicate = await prisma.booking.findFirst({
            where: { user_id: userId, housing_id, status: BookingStatus.ACTIVE },
        });
        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "You already have an active booking for this listing",
            });
        }
        const booking = await prisma.booking.create({
            data: {
                user_id: userId,
                housing_id,
                status: BookingStatus.ACTIVE,
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
    }
    catch (error) {
        console.error("createBooking error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── CANCEL BOOKING (Student / Admin) ────────────────────────────────────────
export const cancelBooking = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const isOwner = booking.user_id === userId;
        const isAdmin = userRole === Role.ADMIN;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        if (booking.status === BookingStatus.CANCELLED) {
            return res.status(400).json({ success: false, message: "Booking is already cancelled" });
        }
        if (booking.status === BookingStatus.COMPLETED) {
            return res.status(400).json({ success: false, message: "Cannot cancel a completed booking" });
        }
        const updated = await prisma.booking.update({
            where: { id },
            data: { status: BookingStatus.CANCELLED },
        });
        return res.status(200).json({ success: true, message: "Booking cancelled", data: updated });
    }
    catch (error) {
        console.error("cancelBooking error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── COMPLETE BOOKING (Host / Admin) ─────────────────────────────────────────
export const completeBooking = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                housing: {
                    select: { id: true, host_id: true }, // explicitly select host_id
                },
            },
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const isHost = booking.housing.host_id === userId;
        const isAdmin = userRole === Role.ADMIN;
        if (!isHost && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only the host or admin can complete a booking",
            });
        }
        if (booking.status !== BookingStatus.ACTIVE) {
            return res.status(400).json({
                success: false,
                message: `Cannot complete a booking with status: ${booking.status}`,
            });
        }
        const updated = await prisma.booking.update({
            where: { id },
            data: { status: BookingStatus.COMPLETED },
        });
        // Mark listing as unavailable once booking is completed
        await prisma.housing.update({
            where: { id: booking.housing_id },
            data: { availability: false },
        });
        return res.status(200).json({ success: true, message: "Booking completed", data: updated });
    }
    catch (error) {
        console.error("completeBooking error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── GET BOOKINGS FOR A LISTING (Host / Admin) ───────────────────────────────
export const getBookingsByListing = async (req, res) => {
    try {
        const housing_id = req.params.housing_id; // matches route param name
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const listing = await prisma.housing.findUnique({ where: { id: housing_id } });
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }
        if (userRole !== Role.ADMIN && listing.host_id !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const bookings = await prisma.booking.findMany({
            where: { housing_id },
            orderBy: { created_at: "desc" },
            include: {
                user: {
                    select: { id: true, full_name: true, email: true, phone: true },
                },
            },
        });
        return res.status(200).json({ success: true, data: bookings });
    }
    catch (error) {
        console.error("getBookingsByListing error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
//# sourceMappingURL=controller.js.map