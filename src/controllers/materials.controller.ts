import prisma from "../config/prisma.js";
import { createMaterialSchema } from "../validators/materials.validator.js";
import type { Request, Response } from "express";

export async function getMaterials(req: Request, res: Response) {
    try {
        const materials = await prisma.material.findMany();
        res.json(materials);
    } catch (error) {
        console.error("Error fetching materials:", error);
        res.status(500).json({ error: "Failed to fetch materials" });
    }
}

export async function getMaterialById(req: Request, res: Response) {
    try {
        const materialId = req.params.id as string;
        const material = await prisma.material.findUnique({ where: { id: materialId } });
        if (!material) {
            return res.status(404).json({ error: "Material not found" });
        }
        res.json(material);
    } catch (error) {
        console.error("Error fetching material:", error);
        res.status(500).json({ error: "Failed to fetch material" });
    }
}

export async function createMaterial(req: Request, res: Response) {
    try {
        const parsed = createMaterialSchema.parse(req.body);
        const material = await prisma.material.create({ data: parsed });
        res.status(201).json(material);
    } catch (error) {
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
        const parsed = createMaterialSchema.parse(req.body);
        const material = await prisma.material.update({
            where: { id: materialId },
            data: parsed,
        });
        res.json(material);
    } catch (error) {
        console.error("Error updating material:", error);
        res.status(500).json({ error: "Failed to update material" });
    }
}

