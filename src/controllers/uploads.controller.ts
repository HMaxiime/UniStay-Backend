import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { deleteFromCloudinary, uploadMaterialToCloudinary } from "../config/cloudinary.js";

const MAX_MATERIAL_FILES = 10;

function toCloudinaryResourceType(resourceType: string): "image" | "video" | "raw" {
  if (resourceType === "image" || resourceType === "video") {
    return resourceType;
  }

  return "raw";
}

async function canManageMaterialFiles(req: Request, materialId: string) {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { id: true, uploadedBy: true },
  });

  if (!material) {
    return { allowed: false, status: 404, error: "Material not found" };
  }

  if (material.uploadedBy !== req.user?.id && req.user?.role !== "ADMIN") {
    return {
      allowed: false,
      status: 403,
      error: "You can only upload files for your own materials",
    };
  }

  return { allowed: true, material };
}

export async function uploadMaterialFile(req: Request, res: Response) {
  try {
    const materialId = req.params["id"] as string;

    if (!materialId) {
      return res.status(400).json({ error: "Invalid material ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const permission = await canManageMaterialFiles(req, materialId);
    if (!permission.allowed) {
      return res.status(permission.status ?? 500).json({ error: permission.error });
    }

    const fileCount = await prisma.materialFile.count({ where: { materialId } });
    if (fileCount >= MAX_MATERIAL_FILES) {
      return res.status(400).json({
        error: `A material can have a maximum of ${MAX_MATERIAL_FILES} files`,
      });
    }

    const uploaded = await uploadMaterialToCloudinary(req.file);
    const file = await prisma.materialFile.create({
      data: {
        url: uploaded.url,
        publicId: uploaded.publicId,
        materialId,
        resourceType: uploaded.resourceType,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        format: uploaded.format,
        bytes: uploaded.bytes,
      },
    });

    return res.status(201).json({
      message: "Material file uploaded successfully",
      file,
    });
  } catch (error) {
    console.error("Error uploading material file:", error);
    return res.status(500).json({ error: "Failed to upload material file" });
  }
}

export async function uploadMaterialFiles(req: Request, res: Response) {
  try {
    const materialId = req.params["id"] as string;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!materialId) {
      return res.status(400).json({ error: "Invalid material ID" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    if (files.length > MAX_MATERIAL_FILES) {
      return res.status(400).json({
        error: `You can upload a maximum of ${MAX_MATERIAL_FILES} files at once`,
      });
    }

    const permission = await canManageMaterialFiles(req, materialId);
    if (!permission.allowed) {
      return res.status(permission.status ?? 500).json({ error: permission.error });
    }

    const existingFileCount = await prisma.materialFile.count({ where: { materialId } });
    if (existingFileCount + files.length > MAX_MATERIAL_FILES) {
      return res.status(400).json({
        error: `A material can have a maximum of ${MAX_MATERIAL_FILES} files`,
        remainingSlots: Math.max(MAX_MATERIAL_FILES - existingFileCount, 0),
      });
    }

    const uploaded = await Promise.all(
      files.map((file) => uploadMaterialToCloudinary(file))
    );

    const materialFiles = await prisma.$transaction(
      uploaded.map((result, index) => {
        const file = files[index];

        return prisma.materialFile.create({
          data: {
            url: result.url,
            publicId: result.publicId,
            materialId,
            resourceType: result.resourceType,
            mimeType: file?.mimetype ?? "application/octet-stream",
            originalName: file?.originalname ?? null,
            format: result.format,
            bytes: result.bytes,
          },
        });
      })
    );

    return res.status(201).json({
      message: "Material files uploaded successfully",
      files: materialFiles,
    });
  } catch (error) {
    console.error("Error uploading material files:", error);
    return res.status(500).json({ error: "Failed to upload material files" });
  }
}

export async function deleteMaterialFile(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string;

    const file = await prisma.materialFile.findUnique({
      where: { id },
      include: {
        material: {
          select: { uploadedBy: true },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ error: "Material file not found" });
    }

    if (file.material.uploadedBy !== req.user?.id && req.user?.role !== "ADMIN") {
      return res.status(403).json({
        error: "You can only delete files from your own materials",
      });
    }

    await deleteFromCloudinary(file.publicId, toCloudinaryResourceType(file.resourceType));
    await prisma.materialFile.delete({ where: { id } });

    return res.json({ message: "Material file deleted successfully" });
  } catch (error) {
    console.error("Error deleting material file:", error);
    return res.status(500).json({ error: "Failed to delete material file" });
  }
}
