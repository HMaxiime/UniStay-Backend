import { prisma } from "../lib/prisma.js";
import type { Request, Response } from "express";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractCloudinaryPublicId,
  compressImage,
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
        // Fall through to comma split
      }
    }
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// ─── GET ALL ROOMS ───────────────────────────────────────────────────────────
export const getRooms = async (req: Request, res: Response) => {
  try {
    const {
      hostelId,
      category,
      min_price,
      max_price,
      availability,
      page = "1",
      limit = "10",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const filters: any = {};

    if (hostelId) {
      filters.hostelId = String(hostelId);
    }

    if (category) {
      filters.category = String(category);
    }

    if (min_price || max_price) {
      filters.price = {
        ...(min_price && { gte: Number(min_price) }),
        ...(max_price && { lte: Number(max_price) }),
      };
    }

    if (availability === "true") {
      filters.availableBeds = { gt: 0 };
    }

    // Standard visitors can only see rooms in VERIFIED hostels
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin) {
      filters.hostel = {
        verificationStatus: "VERIFIED",
      };
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where: filters,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          hostel: {
            select: { id: true, name: true, location: true, verificationStatus: true, hostId: true },
          },
        },
      }),
      prisma.room.count({ where: filters }),
    ]);

    // Format occupancy status and rate
    const roomsWithOccupancy = rooms.map((room) => {
      const occupancyRate = room.capacity > 0 ? ((room.capacity - room.availableBeds) / room.capacity) * 100 : 0;
      let occupancyStatus = "AVAILABLE";
      if (room.availableBeds === 0) {
        occupancyStatus = "FULL";
      } else if (room.availableBeds < room.capacity) {
        occupancyStatus = "PARTIALLY_OCCUPIED";
      }
      return {
        ...room,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        occupancyStatus,
      };
    });

    return res.status(200).json({
      success: true,
      data: roomsWithOccupancy,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getRooms error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET SINGLE ROOM ─────────────────────────────────────────────────────────
export const getRoomById = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return res.status(400).json({ success: false, message: "Room ID is required" });
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        hostel: {
          include: {
            host: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Dynamic occupancy stats
    const occupancyRate = room.capacity > 0 ? ((room.capacity - room.availableBeds) / room.capacity) * 100 : 0;
    let occupancyStatus = "AVAILABLE";
    if (room.availableBeds === 0) {
      occupancyStatus = "FULL";
    } else if (room.availableBeds < room.capacity) {
      occupancyStatus = "PARTIALLY_OCCUPIED";
    }

    const roomDetails = {
      ...room,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      occupancyStatus,
    };

    return res.status(200).json({ success: true, data: roomDetails });
  } catch (error) {
    console.error("getRoomById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── CREATE ROOM ─────────────────────────────────────────────────────────────
export const createRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { hostelId, name, category, capacity, price, description, amenities } = req.body;

    if (!hostelId || !name || !category || capacity === undefined || price === undefined) {
      return res.status(400).json({ success: false, message: "hostelId, name, category, capacity, and price are required" });
    }

    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    if (userRole !== "ADMIN" && hostel.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this hostel" });
    }

    // Validate category capacity constraints
    const cap = Number(capacity);
    if (category === "VIP" && cap !== 2) {
      return res.status(400).json({ success: false, message: "VIP Rooms must have a capacity of exactly 2 students per room." });
    } else if (category === "STANDARD" && cap !== 4) {
      return res.status(400).json({ success: false, message: "Standard Rooms must have a capacity of exactly 4 students per room." });
    } else if (category === "BUDGET" && (cap < 6 || cap > 8)) {
      return res.status(400).json({ success: false, message: "Budget Rooms must have a capacity of 6 to 8 students per room." });
    }

    const uploadedImages: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) =>
          uploadBufferToCloudinary(await compressImage(file.buffer), "unistay/rooms", file.originalname)
        )
      );
      uploadedImages.push(...uploadResults.map((r) => r.url));
    }

    const room = await prisma.room.create({
      data: {
        hostelId,
        name,
        category,
        capacity: cap,
        availableBeds: cap, // All beds available initially
        price: Number(price),
        description: description ?? null,
        amenities: parseAmenities(amenities),
        images: uploadedImages,
      },
    });

    await logActivity(userId, "ROOM_CREATION", `Created room ${name} in hostel ${hostel.name} (${room.id})`);

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    console.error("createRoom error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── UPDATE ROOM ─────────────────────────────────────────────────────────────
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Room ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: { hostel: true },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (userRole !== "ADMIN" && room.hostel.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this room's hostel" });
    }

    const { name, category, capacity, availableBeds, price, description, amenities } = req.body;

    let targetCategory = category || room.category;
    let targetCapacity = capacity !== undefined ? Number(capacity) : room.capacity;

    if (category || capacity !== undefined) {
      if (targetCategory === "VIP" && targetCapacity !== 2) {
        return res.status(400).json({ success: false, message: "VIP Rooms must have a capacity of exactly 2 students." });
      } else if (targetCategory === "STANDARD" && targetCapacity !== 4) {
        return res.status(400).json({ success: false, message: "Standard Rooms must have a capacity of exactly 4 students." });
      } else if (targetCategory === "BUDGET" && (targetCapacity < 6 || targetCapacity > 8)) {
        return res.status(400).json({ success: false, message: "Budget Rooms must have a capacity of 6 to 8 students." });
      }
    }

    // Determine available beds safely: if capacity changed, adjust available beds
    let targetAvailableBeds = room.availableBeds;
    if (capacity !== undefined) {
      const difference = targetCapacity - room.capacity;
      targetAvailableBeds = Math.max(0, room.availableBeds + difference);
    }
    if (availableBeds !== undefined) {
      targetAvailableBeds = Number(availableBeds);
    }

    let mergedImages = room.images as string[];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) =>
          uploadBufferToCloudinary(await compressImage(file.buffer), "unistay/rooms", file.originalname)
        )
      );
      mergedImages = [...mergedImages, ...uploadResults.map((r) => r.url)];
    }

    const updated = await prisma.room.update({
      where: { id },
      data: {
        ...(name && { name }),
        category: targetCategory,
        capacity: targetCapacity,
        availableBeds: targetAvailableBeds,
        ...(price !== undefined && { price: Number(price) }),
        description: description !== undefined ? description : room.description,
        ...(amenities !== undefined && { amenities: parseAmenities(amenities) }),
        images: mergedImages,
      },
    });

    await logActivity(userId, "ROOM_UPDATE", `Updated room ${updated.name} in hostel ${room.hostel.name} (${id})`);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateRoom error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── DELETE ROOM ─────────────────────────────────────────────────────────────
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: { hostel: true },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (userRole !== "ADMIN" && room.hostel.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this room's hostel" });
    }

    // Delete Cloudinary images
    const images = room.images as string[];
    if (images.length > 0) {
      await Promise.allSettled(
        images.map((url) => {
          const publicId = extractCloudinaryPublicId(url);
          return publicId ? deleteFromCloudinary(publicId, "image") : Promise.resolve();
        })
      );
    }

    await prisma.room.delete({ where: { id } });

    await logActivity(userId, "ROOM_DELETION", `Deleted room ${room.name} from hostel ${room.hostel.name} (${id})`);

    return res.status(200).json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    console.error("deleteRoom error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── UPLOAD IMAGES FOR ROOM ──────────────────────────────────────────────────
export const uploadRoomImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No images provided" });
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: { hostel: true },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (userRole !== "ADMIN" && room.hostel.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this room" });
    }

    const uploadResults = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) =>
        uploadBufferToCloudinary(await compressImage(file.buffer), "unistay/rooms", file.originalname)
      )
    );

    const newUrls = uploadResults.map((r) => r.url);
    const updatedImages = [...(room.images as string[]), ...newUrls];

    const updated = await prisma.room.update({
      where: { id },
      data: { images: updatedImages },
    });

    return res.status(200).json({
      success: true,
      message: `${newUrls.length} image(s) uploaded successfully`,
      data: { images: updated.images },
    });
  } catch (error) {
    console.error("uploadRoomImages error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── DELETE A SINGLE IMAGE FROM ROOM ──────────────────────────────────────────
export const deleteRoomImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { imageUrl } = req.query as { imageUrl: string };

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ success: false, message: "imageUrl query parameter is required" });
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: { hostel: true },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (userRole !== "ADMIN" && room.hostel.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this room" });
    }

    const currentImages = room.images as string[];
    if (!currentImages.includes(imageUrl)) {
      return res.status(404).json({ success: false, message: "Image not found on this room" });
    }

    const publicId = extractCloudinaryPublicId(imageUrl);
    if (publicId) {
      await deleteFromCloudinary(publicId, "image");
    }

    const updatedImages = currentImages.filter((img) => img !== imageUrl);
    const updated = await prisma.room.update({
      where: { id },
      data: { images: updatedImages },
    });

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: { images: updated.images },
    });
  } catch (error) {
    console.error("deleteRoomImage error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
