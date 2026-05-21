import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { createQuestionSchema, updateQuestionSchema } from "../validators/learning.validator.js";

export async function createQuestion(req: Request, res: Response) {
  try {
    const data = createQuestionSchema.parse(req.body);
    const question = await prisma.question.create({ data });
    res.status(201).json(question);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to create question" });
  }
}

export async function getQuestionById(req: Request, res: Response) {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id as string },
      include: { options: true, assignment: true },
    });
    if (!question) return res.status(404).json({ error: "Question not found" });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch question" });
  }
}

export async function updateQuestion(req: Request, res: Response) {
  try {
    const data = updateQuestionSchema.parse(req.body);
    const question = await prisma.question.update({
      where: { id: req.params.id as string },
      data: data as any,
    });
    res.json(question);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to update question" });
  }
}

export async function deleteQuestion(req: Request, res: Response) {
  try {
    await prisma.question.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete question" });
  }
}
