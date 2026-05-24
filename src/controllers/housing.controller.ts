import { prisma } from "../lib/prisma.js";
import type { Request, Response } from "express";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractCloudinaryPublicId,
} from "../config/cloudinary.js";

// ─── GET ALL LISTINGS (with filters) ────────────────────────────────────────
export const getListings = async (req: Request, res: Response) => {
  try {
    const {
      location,
      min_price,
      max_price,
      bedrooms,
      availability,
      page = "1",
      limit = "10",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filters: any = {
      verificationStatus: "VERIFIED",
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
        orderBy: { createdAt: "desc" },
        include: {
          host: {
            select: { id: true, fullName: true, email: true, phone: true },
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
  } catch (error) {
    console.error("getListings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET SINGLE LISTING ──────────────────────────────────────────────────────
export const getListingById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ success: false, message: "Listing ID is required" });
    }

    const listing = await prisma.housing.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    return res.status(200).json({ success: true, data: listing });
  } catch (error) {
    console.error("getListingById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── CREATE LISTING (Host / Admin only) ──────────────────────────────────────
export const createListing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized - user session not found" });
    }

    if (userRole !== "HOST" && userRole !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only hosts can create listings" });
    }

    const { title, description, location, price, bedrooms, amenities, availability } = req.body;

    if (!title || !location || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "title, location, and price are required",
      });
    }

    // Upload any attached images to Cloudinary
    const uploadedImages: string[] = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await Promise.all(
        (req.files as Express.Multer.File[]).map((file) =>
          uploadBufferToCloudinary(file.buffer, "unistay/housing", file.originalname)
        )
      );
      uploadedImages.push(...uploadResults.map((r) => r.url));
    }

    const listing = await prisma.housing.create({
      data: {
        title,
        description: description ?? null,
        location,
        price: Number(price),
        bedrooms: bedrooms !== undefined ? Number(bedrooms) : null,
        amenities: amenities ?? [],
        images: uploadedImages,
        availability: availability ?? true,
        hostId: userId,
        verificationStatus: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Listing created and pending verification",
      data: listing,
    });
  } catch (error) {
    console.error("createListing error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── UPDATE LISTING (Host who owns it / Admin) ───────────────────────────────
export const updateListing = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Listing ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const existing = await prisma.housing.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    if (userRole !== "ADMIN" && existing.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden - you do not own this listing" });
    }

    const { title, description, location, price, bedrooms, amenities, availability } = req.body;

    // Upload any newly attached images and merge with existing ones
    let mergedImages: string[] = existing.images as string[];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadResults = await Promise.all(
        (req.files as Express.Multer.File[]).map((file) =>
          uploadBufferToCloudinary(file.buffer, "unistay/housing", file.originalname)
        )
      );
      mergedImages = [...mergedImages, ...uploadResults.map((r) => r.url)];
    }

    const updated = await prisma.housing.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(location && { location }),
        ...(price !== undefined && { price: Number(price) }),
        ...(bedrooms !== undefined && { bedrooms: Number(bedrooms) }),
        ...(amenities && { amenities }),
        images: mergedImages,
        ...(availability !== undefined && { availability }),
        // Non-admin edits reset verification so admin must re-approve
        ...(userRole !== "ADMIN" && { verificationStatus: "PENDING" }),
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateListing error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── DELETE LISTING (Host who owns it / Admin) ───────────────────────────────
export const deleteListing = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Listing ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const existing = await prisma.housing.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    if (userRole !== "ADMIN" && existing.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden - you do not own this listing" });
    }

    // Delete all associated Cloudinary images before removing the record
    const imageUrls = existing.images as string[];
    if (imageUrls.length > 0) {
      await Promise.allSettled(
        imageUrls.map((url) => {
          const publicId = extractCloudinaryPublicId(url);
          return publicId ? deleteFromCloudinary(publicId, "image") : Promise.resolve();
        })
      );
    }

    await prisma.housing.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Listing deleted successfully" });
  } catch (error) {
    console.error("deleteListing error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── UPLOAD IMAGES for an existing listing ───────────────────────────────────
export const uploadHousingImages = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Listing ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No images provided" });
    }

    const existing = await prisma.housing.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    if (userRole !== "ADMIN" && existing.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden - you do not own this listing" });
    }

    const uploadResults = await Promise.all(
      (req.files as Express.Multer.File[]).map((file) =>
        uploadBufferToCloudinary(file.buffer, "unistay/housing", file.originalname)
      )
    );

    const newUrls = uploadResults.map((r) => r.url);
    const updatedImages = [...(existing.images as string[]), ...newUrls];

    const updated = await prisma.housing.update({
      where: { id },
      data: {
        images: updatedImages,
        // Non-admin image additions also reset verification
        ...(userRole !== "ADMIN" && { verificationStatus: "PENDING" }),
      },
    });

    return res.status(200).json({
      success: true,
      message: `${newUrls.length} image(s) uploaded successfully`,
      data: { images: updated.images },
    });
  } catch (error) {
    console.error("uploadHousingImages error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── DELETE A SINGLE IMAGE from a listing ────────────────────────────────────
export const deleteHousingImage = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Listing ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // imageUrl is passed as a query param: DELETE /housing/:id/images?imageUrl=https://...
    const { imageUrl } = req.query;

    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ success: false, message: "imageUrl query parameter is required" });
    }

    const existing = await prisma.housing.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    if (userRole !== "ADMIN" && existing.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden - you do not own this listing" });
    }

    const currentImages = existing.images as string[];

    if (!currentImages.includes(imageUrl)) {
      return res.status(404).json({ success: false, message: "Image not found on this listing" });
    }

    // Remove from Cloudinary
    const publicId = extractCloudinaryPublicId(imageUrl);
    if (publicId) {
      await deleteFromCloudinary(publicId, "image");
    }

    // Remove from DB record
    const updatedImages = currentImages.filter((img) => img !== imageUrl);

    const updated = await prisma.housing.update({
      where: { id },
      data: {
        images: updatedImages,
        ...(userRole !== "ADMIN" && { verificationStatus: "PENDING" }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: { images: updated.images },
    });
  } catch (error) {
    console.error("deleteHousingImage error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── VERIFY LISTING (Admin only) ─────────────────────────────────────────────
export const verifyListing = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({ success: false, message: "Listing ID is required" });
    }

    if (userRole !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { status } = req.body;

    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be VERIFIED or REJECTED",
      });
    }

    const listing = await prisma.housing.update({
      where: { id },
      data: { verificationStatus: status },
    });

    return res.status(200).json({
      success: true,
      message: `Listing ${status.toLowerCase()} successfully`,
      data: listing,
    });
  } catch (error) {
    console.error("verifyListing error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET MY LISTINGS (Host's own listings) ───────────────────────────────────
export const getMyListings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const listings = await prisma.housing.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: listings });
  } catch (error) {
    console.error("getMyListings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
