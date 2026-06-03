import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import {
  deleteFromCloudinary,
  uploadAvatarToCloudinary,
  uploadCourseThumbnailToCloudinary,
  uploadMaterialToCloudinary,
  extractCloudinaryPublicId,
} from "../config/cloudinary.js";

function toCloudinaryResourceType(resourceType: string): "image" | "video" | "raw" {
  if (resourceType === "image" || resourceType === "video") {
    return resourceType;
  }

  return "raw";
}

export async function uploadFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const materialId = req.body.materialId;
    if (typeof materialId !== "string") {
      return res.status(400).json({ error: "materialId is required" });
    }

    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }
    if (material.uploadedBy !== req.userId) {
      return res.status(403).json({ error: "You can only upload files to your own materials" });
    }

    const uploaded = await uploadMaterialToCloudinary(req.file);
    const file = await prisma.materialFile.create({
      data: {
        url: uploaded.url,
        publicId: uploaded.publicId,
        materialId,
        resourceType: uploaded.resourceType,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        format: uploaded.format,
        bytes: uploaded.bytes,
      },
    });

    return res.status(201).json(file);
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ error: "Failed to upload file" });
  }
}

export async function uploadCourseThumbnail(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Thumbnail image is required" });
    }
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Thumbnail must be an image file" });
    }

    const uploaded = await uploadCourseThumbnailToCloudinary(req.file);
    return res.status(201).json({ url: uploaded.url });
  } catch (error) {
    console.error("Error uploading course thumbnail:", error);
    return res.status(500).json({ error: "Failed to upload course thumbnail" });
  }
}

export async function getUploads(_req: Request, res: Response) {
  try {
    const files = await prisma.materialFile.findMany({
      include: { material: true },
    });
    return res.json(files);
  } catch (error) {
    console.error("Error fetching uploads:", error);
    return res.status(500).json({ error: "Failed to fetch uploads" });
  }
}

export async function getUploadById(req: Request, res: Response) {
  try {
    const file = await prisma.materialFile.findUnique({
      where: { id: req.params.id as string },
      include: { material: true },
    });

    if (!file) {
      return res.status(404).json({ error: "Uploaded file not found" });
    }
    const material = await prisma.material.findUnique({ where: { id: file.materialId } });
    if (!material || material.uploadedBy !== req.userId) {
      return res.status(403).json({ error: "You can only delete files from your own materials" });
    }

    return res.json(file);
  } catch (error) {
    console.error("Error fetching upload:", error);
    return res.status(500).json({ error: "Failed to fetch upload" });
  }
}

export async function deleteUpload(req: Request, res: Response) {
  try {
    const file = await prisma.materialFile.findUnique({
      where: { id: req.params.id as string },
    });

    if (!file) {
      return res.status(404).json({ error: "Uploaded file not found" });
    }
    const material = await prisma.material.findUnique({ where: { id: file.materialId } });
    if (!material || material.uploadedBy !== req.userId) {
      return res.status(403).json({ error: "You can only delete files from your own materials" });
    }

    await deleteFromCloudinary(file.publicId, toCloudinaryResourceType(file.resourceType));
    await prisma.materialFile.delete({ where: { id: file.id } });

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting upload:", error);
    return res.status(500).json({ error: "Failed to delete upload" });
  }
}

export async function uploadAvatar(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Avatar image is required" });
    }
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Avatar must be an image file" });
    }

    const uploaded = await uploadAvatarToCloudinary(req.file, req.userId);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { Avatar: uploaded.url },
      data: { avatar: uploaded.url },
      select: {
        id: true,
        fullName: true,
        email: true,
        Avatar: true,
        avatar: true,
      },
    });

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      user: { ...user, avatar: user.Avatar },
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return res.status(500).json({ error: "Failed to upload avatar" });
  }
}

export async function updateAvatar(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Avatar image is required" });
    }
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Avatar must be an image file" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { Avatar: true } as any,
    }) as any;

    if (currentUser?.Avatar) {
      const publicId = extractCloudinaryPublicId(currentUser.Avatar);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId, "image");
        } catch (deleteError) {
          console.error("Error deleting old avatar from Cloudinary:", deleteError);
        }
      }
    }

    const uploaded = await uploadAvatarToCloudinary(req.file, req.userId);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { Avatar: uploaded.url },
      select: {
        id: true,
        fullName: true,
        email: true,
        Avatar: true,
      },
    });

    return res.status(200).json({
      message: "Avatar updated successfully",
      user: { ...user, avatar: user.Avatar },
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
}

export async function deleteAvatar(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { Avatar: true } as any,
    }) as any;

    if (!user?.Avatar) {
      return res.status(404).json({ error: "User has no avatar to delete" });
    }

    const publicId = extractCloudinaryPublicId(user.Avatar);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId, "image");
      } catch (deleteError) {
        console.error("Error deleting avatar from Cloudinary:", deleteError);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { Avatar: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        Avatar: true,
      },
    });

    return res.status(200).json({
      message: "Avatar deleted successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return res.status(500).json({ error: "Failed to delete avatar" });
  }
}
