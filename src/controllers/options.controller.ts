import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { createOptionSchema, updateOptionSchema } from "../validators/learning.validator.js";

export async function createOption(req: Request, res: Response) {
  try {
    const data = createOptionSchema.parse(req.body);
    const question = await prisma.question.findUnique({ where: { id: data.questionId }, include: { assignment: { include: { course: true } } } });
    if (!question) return res.status(404).json({ error: "Question not found" });
    if (question.assignment.course.uploadedBy !== req.userId) return res.status(403).json({ error: "You can only add answers to your own courses" });
    const option = await prisma.option.create({ data: data as any });
    res.status(201).json(option);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to create option" });
  }
}

export async function updateOption(req: Request, res: Response) {
  try {
    const data = updateOptionSchema.parse(req.body);
    const existing = await prisma.option.findUnique({ where: { id: req.params.id as string }, include: { question: { include: { assignment: { include: { course: true } } } } } });
    if (!existing) return res.status(404).json({ error: "Option not found" });
    if (existing.question.assignment.course.uploadedBy !== req.userId) return res.status(403).json({ error: "You can only update answers for your own courses" });
    const option = await prisma.option.update({
      where: { id: req.params.id as string },
      data: data as any,
    });
    res.json(option);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to update option" });
  }
}

export async function deleteOption(req: Request, res: Response) {
  try {
    const existing = await prisma.option.findUnique({ where: { id: req.params.id as string }, include: { question: { include: { assignment: { include: { course: true } } } } } });
    if (!existing) return res.status(404).json({ error: "Option not found" });
    if (existing.question.assignment.course.uploadedBy !== req.userId) return res.status(403).json({ error: "You can only delete answers for your own courses" });
    await prisma.option.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete option" });
  }
}
