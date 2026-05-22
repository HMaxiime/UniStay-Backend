import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { deleteFromCloudinary, uploadMaterialToCloudinary } from "../config/cloudinary.js";

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

    await deleteFromCloudinary(file.publicId, toCloudinaryResourceType(file.resourceType));
    await prisma.materialFile.delete({ where: { id: file.id } });

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting upload:", error);
    return res.status(500).json({ error: "Failed to delete upload" });
  }
}
