import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from "../validators/learning.validator.js";

export async function createAssignment(req: Request, res: Response) {
  try {
    const data = createAssignmentSchema.parse(req.body);
    const assignment = await prisma.assignment.create({ data: data as any });
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to create assignment" });
  }
}

export async function getAssignments(_req: Request, res: Response) {
  try {
    const assignments = await prisma.assignment.findMany({
      include: { material: true, skill: true, questions: { include: { options: true } } },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
}

export async function getAssignmentById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { material: true, skill: true, questions: { include: { options: true } } },
    });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
}

export async function updateAssignment(req: Request, res: Response) {
  try {
    const data = updateAssignmentSchema.parse(req.body);
    const id = req.params.id as string;
    const assignment = await prisma.assignment.update({
      where: { id },
      data: data as any,
    });
    res.json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to update assignment" });
  }
}

export async function deleteAssignment(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    await prisma.assignment.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete assignment" });
  }
}
