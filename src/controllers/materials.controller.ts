import prisma from "../config/prisma.js";
import { createMaterialSchema, updateMaterialSchema } from "../validators/materials.validator.js";
import type { Request, Response } from "express";
import { ZodError } from "zod";

const materialInclude = {
    course: true,
    files: true,
};

function withVideoFiles<T extends { files: Array<{ resourceType: string; mimeType: string }> }>(material: T) {
    return {
        ...material,
        videoFiles: material.files.filter(
            (file) => file.resourceType === "video" || file.mimeType.startsWith("video/")
        ),
    };
}

export async function getMaterials(req: Request, res: Response) {
    try {
        const materials = await prisma.material.findMany({
            include: materialInclude,
        });
        res.json(materials);
    } catch (error) {
        console.error("Error fetching materials:", error);
        res.status(500).json({ error: "Failed to fetch materials" });
    }
}

export async function getMaterialById(req: Request, res: Response) {
    try {
        const materialId = req.params.id as string;
        const material = await prisma.material.findUnique({
            where: { id: materialId },
            include: materialInclude,
        });
        if (!material) {
            return res.status(404).json({ error: "Material not found" });
        }
        res.json(withVideoFiles(material));
    } catch (error) {
        console.error("Error fetching material:", error);
        res.status(500).json({ error: "Failed to fetch material" });
    }
}

export async function createMaterial(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const courseId = req.params.courseId as string;
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        const parsed = createMaterialSchema.parse(req.body);
        const createData: {
            title: string;
            type: "VIDEO" | "PDF" | "ARTICLE" | "QUIZ";
            uploadedBy: string;
            courseId: string;
            description?: string;
            duration?: number;
        } = {
            title: parsed.title,
            type: parsed.type,
            uploadedBy: req.userId,
            courseId,
        };

        if (parsed.description !== undefined) {
            createData.description = parsed.description;
        }
        if (parsed.duration !== undefined) {
            createData.duration = parsed.duration;
        }

        const material = await prisma.material.create({
            data: createData,
            include: { files: true },
        });
        res.status(201).json(material);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Invalid material data", details: error.issues });
        }

        console.error("Error creating material:", error);
        res.status(500).json({ error: "Failed to create material" });
    }
}

export async function deleteMaterial(req: Request, res: Response) {
    try {
        const materialId = req.params.id as string;
        await prisma.material.delete({ where: { id: materialId } });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting material:", error);
        res.status(500).json({ error: "Failed to delete material" });
    }
}

export async function updateMaterial(req: Request, res: Response) {
    try {
        const materialId = req.params.id as string;
        const parsed = updateMaterialSchema.parse(req.body);

        const existingMaterial = await prisma.material.findUnique({ where: { id: materialId } });
        if (!existingMaterial) {
            return res.status(404).json({ error: "Material not found" });
        }

        const updateData: {
            title?: string;
            description?: string;
            type?: "VIDEO" | "PDF" | "ARTICLE" | "QUIZ";
            duration?: number;
        } = {};

        if (parsed.title !== undefined) {
            updateData.title = parsed.title;
        }
        if (parsed.description !== undefined) {
            updateData.description = parsed.description;
        }
        if (parsed.type !== undefined) {
            updateData.type = parsed.type;
        }
        if (parsed.duration !== undefined) {
            updateData.duration = parsed.duration;
        }

        const material = await prisma.material.update({
            where: { id: materialId },
            data: updateData,
            include: materialInclude,
        });

        res.json(material);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: "Invalid material data", details: error.issues });
        }

        console.error("Error updating material:", error);
        res.status(500).json({ error: "Failed to update material" });
    }
}

