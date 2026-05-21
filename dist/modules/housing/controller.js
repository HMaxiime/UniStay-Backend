import { prisma } from "../../lib/prisma.js";
// ─── GET ALL LISTINGS (with filters) ────────────────────────────────────────
export const getListings = async (req, res) => {
    try {
        const { location, min_price, max_price, bedrooms, availability, page = "1", limit = "10", } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const filters = {
            verification_status: "VERIFIED", // only show verified listings
        };
        if (location) {
            filters.location = {
                contains: String(location),
                mode: "insensitive",
            };
        }
        if (min_price || max_price) {
            filters.price = {
                ...(min_price && { gte: Number(min_price) }),
                ...(max_price && { lte: Number(max_price) }),
            };
        }
        if (bedrooms) {
            filters.bedrooms = Number(bedrooms);
        }
        if (availability !== undefined) {
            filters.availability = availability === "true";
        }
        const [listings, total] = await Promise.all([
            prisma.housing.findMany({
                where: filters,
                skip,
                take: Number(limit),
                orderBy: { created_at: "desc" },
                include: {
                    host: {
                        select: { id: true, full_name: true, email: true, phone: true },
                    },
                },
            }),
            prisma.housing.count({ where: filters }),
        ]);
        return res.status(200).json({
            success: true,
            data: listings,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("getListings error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── GET SINGLE LISTING ──────────────────────────────────────────────────────
export const getListingById = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await prisma.housing.findUnique({
            where: { id },
            include: {
                host: {
                    select: { id: true, full_name: true, email: true, phone: true },
                },
            },
        });
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }
        return res.status(200).json({ success: true, data: listing });
    }
    catch (error) {
        console.error("getListingById error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── CREATE LISTING (Host only) ──────────────────────────────────────────────
export const createListing = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (userRole !== "HOST" && userRole !== "ADMIN") {
            return res.status(403).json({ success: false, message: "Only hosts can create listings" });
        }
        const { title, description, location, price, bedrooms, amenities, images, availability, } = req.body;
        if (!title || !location || !price) {
            return res.status(400).json({
                success: false,
                message: "title, location, and price are required",
            });
        }
        const listing = await prisma.housing.create({
            data: {
                title,
                description,
                location,
                price: Number(price),
                bedrooms: bedrooms ? Number(bedrooms) : null,
                amenities: amenities ?? [],
                images: images ?? [],
                availability: availability ?? true,
                host_id: userId,
                verification_status: "PENDING", // requires admin approval per SRS
            },
        });
        return res.status(201).json({
            success: true,
            message: "Listing created and pending verification",
            data: listing,
        });
    }
    catch (error) {
        console.error("createListing error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── UPDATE LISTING (Host/Admin) ─────────────────────────────────────────────
export const updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const existing = await prisma.housing.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }
        // Only the owner host or an admin can update
        if (userRole !== "ADMIN" && existing.host_id !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const { title, description, location, price, bedrooms, amenities, images, availability, } = req.body;
        const updated = await prisma.housing.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(location && { location }),
                ...(price !== undefined && { price: Number(price) }),
                ...(bedrooms !== undefined && { bedrooms: Number(bedrooms) }),
                ...(amenities && { amenities }),
                ...(images && { images }),
                ...(availability !== undefined && { availability }),
                // Reset to PENDING if a non-admin edits (re-verification required)
                ...(userRole !== "ADMIN" && { verification_status: "PENDING" }),
            },
        });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        console.error("updateListing error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── DELETE LISTING (Host/Admin) ─────────────────────────────────────────────
export const deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const existing = await prisma.housing.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }
        if (userRole !== "ADMIN" && existing.host_id !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        await prisma.housing.delete({ where: { id } });
        return res.status(200).json({ success: true, message: "Listing deleted" });
    }
    catch (error) {
        console.error("deleteListing error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── VERIFY LISTING (Admin only) ─────────────────────────────────────────────
export const verifyListing = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user?.role;
        if (userRole !== "ADMIN") {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const { status } = req.body; // "VERIFIED" | "REJECTED"
        if (!["VERIFIED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "status must be VERIFIED or REJECTED",
            });
        }
        const listing = await prisma.housing.update({
            where: { id },
            data: { verification_status: status },
        });
        return res.status(200).json({
            success: true,
            message: `Listing ${status.toLowerCase()}`,
            data: listing,
        });
    }
    catch (error) {
        console.error("verifyListing error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── GET MY LISTINGS (Host's own listings) ───────────────────────────────────
export const getMyListings = async (req, res) => {
    try {
        const userId = req.user?.id;
        const listings = await prisma.housing.findMany({
            where: { host_id: userId },
            orderBy: { created_at: "desc" },
        });
        return res.status(200).json({ success: true, data: listings });
    }
    catch (error) {
        console.error("getMyListings error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── ROOMMATE MATCHING (SRS §3.2) ────────────────────────────────────────────
export const getRoommateMatches = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Find listings the current user has booked/applied for
        const userBooking = await prisma.booking.findFirst({
            where: { user_id: userId, status: "ACTIVE" },
            include: { housing: true },
        });
        if (!userBooking) {
            return res.status(404).json({
                success: false,
                message: "No active housing found. Book a listing first.",
            });
        }
        // Find other students in the same listing
        const matches = await prisma.booking.findMany({
            where: {
                housing_id: userBooking.housing_id,
                user_id: { not: userId },
                status: "ACTIVE",
            },
            include: {
                user: {
                    select: { id: true, full_name: true, location: true, skills_profile: true },
                },
            },
        });
        return res.status(200).json({ success: true, data: matches });
    }
    catch (error) {
        console.error("getRoommateMatches error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
// ─── BOOK A LISTING (Student) ────────────────────────────────────────────────
export const bookListing = async (req, res) => {
    try {
        const { id } = req.params; // housing id
        const userId = req.user?.id;
        const listing = await prisma.housing.findUnique({ where: { id } });
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }
        if (listing.verification_status !== "VERIFIED") {
            return res.status(400).json({ success: false, message: "Listing is not verified" });
        }
        if (!listing.availability) {
            return res.status(400).json({ success: false, message: "Listing is not available" });
        }
        // Prevent double booking
        const existing = await prisma.booking.findFirst({
            where: { user_id: userId, housing_id: id, status: "ACTIVE" },
        });
        if (existing) {
            return res.status(409).json({ success: false, message: "Already booked this listing" });
        }
        const booking = await prisma.booking.create({
            data: {
                user_id: userId,
                housing_id: id,
                status: "ACTIVE",
            },
        });
        return res.status(201).json({ success: true, data: booking });
    }
    catch (error) {
        console.error("bookListing error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
//# sourceMappingURL=controller.js.map