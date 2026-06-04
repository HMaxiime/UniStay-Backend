import { prisma } from "../lib/prisma.js";
import type { Request, Response } from "express";
import type { RoomCategory } from "@prisma/client";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractCloudinaryPublicId,
} from "../config/cloudinary.js";

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

function parseAmenities(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // fall back to comma-separated strings
      }
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

// ─── GET ALL HOSTELS ─────────────────────────────────────────────────────────
export const getHostels = async (req: Request, res: Response) => {
  try {
    const {
      location,
      name,
      status,
      page = "1",
      limit = "10",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const isAdmin = req.user?.role === "ADMIN";
    const filters: any = {};

    // Standard visitors only see VERIFIED hostels. Admins see all by default but can filter.
    if (!isAdmin) {
      filters.verificationStatus = "VERIFIED";
    } else if (status) {
      filters.verificationStatus = String(status);
    }

    if (location) {
      filters.location = {
        contains: String(location),
        mode: "insensitive",
      };
    }

    if (name) {
      filters.name = {
        contains: String(name),
        mode: "insensitive",
      };
    }

    const [hostels, total] = await Promise.all([
      prisma.hostel.findMany({
        where: filters,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          host: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          rooms: {
            select: { id: true, name: true, category: true, price: true, availableBeds: true },
          },
        },
      }),
      prisma.hostel.count({ where: filters }),
    ]);

    const hostelsWithRoomMeta = hostels.map((hostel) => ({
      ...hostel,
      price: hostel.rooms[0]?.price ?? null,
      firstRoomId: hostel.rooms[0]?.id ?? null,
      availableBeds: hostel.rooms.reduce((sum, room) => sum + (room.availableBeds ?? 0), 0),
      available: hostel.rooms.some((room) => room.availableBeds > 0),
    }));

    return res.status(200).json({
      success: true,
      data: hostelsWithRoomMeta,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getHostels error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET SINGLE HOSTEL ────────────────────────────────────────────────────────
export const getHostelById = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        rooms: true,
      },
    });

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    const hostelWithMeta = {
      ...hostel,
      price: hostel.rooms[0]?.price ?? null,
      firstRoomId: hostel.rooms[0]?.id ?? null,
      availableBeds: hostel.rooms.reduce((sum, room) => sum + (room.availableBeds ?? 0), 0),
      available: hostel.rooms.some((room) => room.availableBeds > 0),
    };

    return res.status(200).json({ success: true, data: hostelWithMeta });
  } catch (error) {
    console.error("getHostelById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── CREATE HOSTEL ───────────────────────────────────────────────────────────
export const createHostel = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (userRole !== "HOST" && userRole !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only hosts and admins can create hostels" });
    }

    const { name, location, description, roomName, category, capacity, price, amenities, bedrooms } = req.body;

    if (!name || !location) {
      return res.status(400).json({ success: false, message: "name and location are required" });
    }

    const parsedCapacity = capacity !== undefined ? Number(capacity) : bedrooms !== undefined ? Number(bedrooms) : undefined;
    const hasRoomPayload = category !== undefined || parsedCapacity !== undefined || price !== undefined || roomName !== undefined || amenities !== undefined;
    const parsedPrice = price !== undefined ? Number(price) : undefined;

    if (hasRoomPayload) {
      if (!category || parsedCapacity === undefined || parsedPrice === undefined) {
        return res.status(400).json({
          success: false,
          message: "Room details are required when creating a listing: category, capacity, and price must be provided.",
        });
      }

      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ success: false, message: "Room price must be a positive number." });
      }

      if (category === "VIP" && parsedCapacity !== 2) {
        return res.status(400).json({ success: false, message: "VIP Rooms must have a capacity of exactly 2 students per room." });
      }
      if (category === "STANDARD" && parsedCapacity !== 4) {
        return res.status(400).json({ success: false, message: "Standard Rooms must have a capacity of exactly 4 students per room." });
      }
      if (category === "BUDGET" && (parsedCapacity < 6 || parsedCapacity > 8)) {
        return res.status(400).json({ success: false, message: "Budget Rooms must have a capacity of 6 to 8 students per room." });
      }
    }

    const uploadedImages: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await Promise.all(
        (req.files as Express.Multer.File[]).map((file) =>
          uploadBufferToCloudinary(file.buffer, "unistay/hostels", file.originalname)
        )
      );
      uploadedImages.push(...uploadResults.map((r) => r.url));
    }

    const hostel = await prisma.hostel.create({
      data: {
        name,
        location,
        description: description ?? null,
        images: uploadedImages,
        hostId: userId,
        verificationStatus: "PENDING",
        ...(hasRoomPayload
          ? {
              rooms: {
                create: {
                  name: String(roomName ?? `${name} Room`),
                  category: category as RoomCategory,
                  capacity: parsedCapacity ?? 0,
                  availableBeds: parsedCapacity ?? 0,
                  price: parsedPrice ?? 0,
                  description: description ?? null,
                  amenities: parseAmenities(amenities),
                },
              },
            }
          : {}),
      },
      include: {
        rooms: true,
      },
    });

    const hostelWithMeta = {
      ...hostel,
      price: hostel.rooms[0]?.price ?? null,
      firstRoomId: hostel.rooms[0]?.id ?? null,
      availableBeds: hostel.rooms.reduce((sum, room) => sum + (room.availableBeds ?? 0), 0),
      available: hostel.rooms.some((room) => room.availableBeds > 0),
    };

    await logActivity(userId, "HOSTEL_CREATION", `Created hostel ${name} (${hostel.id})`);

    return res.status(201).json({
      success: true,
      message: "Hostel created and pending verification",
      data: hostelWithMeta,
    });
  } catch (error) {
    console.error("createHostel error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── UPDATE HOSTEL ───────────────────────────────────────────────────────────
export const updateHostel = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const hostel = await prisma.hostel.findUnique({ where: { id } });
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    if (userRole !== "ADMIN" && hostel.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this hostel" });
    }

    const { name, location, description } = req.body;

    let mergedImages = hostel.images as string[];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await Promise.all(
        (req.files as Express.Multer.File[]).map((file) =>
          uploadBufferToCloudinary(file.buffer, "unistay/hostels", file.originalname)
        )
      );
      mergedImages = [...mergedImages, ...uploadResults.map((r) => r.url)];
    }

    const updated = await prisma.hostel.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        description: description !== undefined ? description : hostel.description,
        images: mergedImages,
        // Reset verification on updates unless updated by admin
        ...(userRole !== "ADMIN" && { verificationStatus: "PENDING" }),
      },
    });

    await logActivity(userId, "HOSTEL_UPDATE", `Updated hostel ${updated.name} (${id})`);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateHostel error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── DELETE HOSTEL ───────────────────────────────────────────────────────────
export const deleteHostel = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const hostel = await prisma.hostel.findUnique({ where: { id } });
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    if (userRole !== "ADMIN" && hostel.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this hostel" });
    }

    // Delete Cloudinary images
    const images = hostel.images as string[];
    if (images.length > 0) {
      await Promise.allSettled(
        images.map((url) => {
          const publicId = extractCloudinaryPublicId(url);
          return publicId ? deleteFromCloudinary(publicId, "image") : Promise.resolve();
        })
      );
    }

    await prisma.hostel.delete({ where: { id } });

    await logActivity(userId, "HOSTEL_DELETION", `Deleted hostel ${hostel.name} (${id})`);

    return res.status(200).json({ success: true, message: "Hostel deleted successfully" });
  } catch (error) {
    console.error("deleteHostel error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── VERIFY HOSTEL (Admin only) ─────────────────────────────────────────────
export const verifyHostel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    const adminId = req.user?.id as string;

    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be VERIFIED or REJECTED" });
    }

    const hostel = await prisma.hostel.update({
      where: { id },
      data: { verificationStatus: status },
    });

    await logActivity(adminId, "HOSTEL_VERIFICATION", `Moderated hostel ${hostel.name} (${id}) status to ${status}`);

    return res.status(200).json({
      success: true,
      message: `Hostel ${status.toLowerCase()} successfully`,
      data: hostel,
    });
  } catch (error) {
    console.error("verifyHostel error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET HOST'S OWN HOSTELS ──────────────────────────────────────────────────
export const getMyHostels = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const hostels = await prisma.hostel.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        rooms: {
          select: { id: true, name: true, category: true, price: true, availableBeds: true, capacity: true },
        },
      },
    });

    return res.status(200).json({ success: true, data: hostels });
  } catch (error) {
    console.error("getMyHostels error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
