import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { createMaterialSkillSchema } from "../validators/learning.validator.js";

export async function createMaterialSkill(req: Request, res: Response) {
  try {
    const data = createMaterialSkillSchema.parse(req.body);
    const materialSkill = await prisma.materialSkill.create({
      data,
      include: { material: true, skill: true },
    });
    res.status(201).json(materialSkill);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to link material to skill" });
  }
}

export async function deleteMaterialSkill(req: Request, res: Response) {
  try {
    await prisma.materialSkill.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete material skill link" });
  }
}
