import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from "../validators/learning.validator.js";

export async function createAssignment(req: Request, res: Response) {
  try {
    const data = createAssignmentSchema.parse(req.body);
    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.uploadedBy !== req.userId) return res.status(403).json({ error: "You can only add exams to your own courses" });

    const createData: {
      title: string;
      courseId: string;
      isStandalone?: boolean;
      timeLimit?: number;
      passingScore?: number;
    } = {
      title: data.title,
      courseId: data.courseId,
    };

    if (data.isStandalone !== undefined) {
      createData.isStandalone = data.isStandalone;
    }
    if (data.timeLimit !== undefined) {
      createData.timeLimit = data.timeLimit;
    }
    if (data.passingScore !== undefined) {
      createData.passingScore = data.passingScore;
    }

    const assignment = await prisma.assignment.create({
      data: createData,
      include: { course: true, questions: { include: { options: true } } },
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to create assignment" });
  }
}

export async function getAssignments(req: Request, res: Response) {
  try {
    if (req.user?.role !== "INSTRUCTOR") {
      const assignments = await prisma.assignment.findMany({ include: { course: true } });
      return res.json(assignments);
    }
    const assignments = await prisma.assignment.findMany({
      where: { course: { uploadedBy: req.user.id } },
      include: { course: true, questions: { include: { options: true } } },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
}

export async function getAssignmentById(req: Request, res: Response) {
  try {
    if (req.user?.role !== "INSTRUCTOR") {
      const assignment = await prisma.assignment.findUnique({
        where: { id: req.params.id as string },
        include: { course: true },
      });
      if (!assignment) return res.status(404).json({ error: "Assignment not found" });
      return res.json(assignment);
    }
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id as string },
      include: { course: true, questions: { include: { options: true } } },
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
    const existing = await prisma.assignment.findUnique({ where: { id: req.params.id as string }, include: { course: true } });
    if (!existing) return res.status(404).json({ error: "Assignment not found" });
    if (existing.course.uploadedBy !== req.userId) return res.status(403).json({ error: "You can only update exams for your own courses" });
    if (data.courseId) {
      const course = await prisma.course.findUnique({ where: { id: data.courseId } });
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (course.uploadedBy !== req.userId) return res.status(403).json({ error: "You can only move exams to your own courses" });
    }

    const updateData: Record<string, string | number | boolean> = {};
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.courseId !== undefined) {
      updateData.courseId = data.courseId;
    }
    if (data.isStandalone !== undefined) {
      updateData.isStandalone = data.isStandalone;
    }
    if (data.timeLimit !== undefined) {
      updateData.timeLimit = data.timeLimit;
    }
    if (data.passingScore !== undefined) {
      updateData.passingScore = data.passingScore;
    }

    const assignment = await prisma.assignment.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: { course: true, questions: { include: { options: true } } },
    });
    res.json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to update assignment" });
  }
}

export async function deleteAssignment(req: Request, res: Response) {
  try {
    const existing = await prisma.assignment.findUnique({ where: { id: req.params.id as string }, include: { course: true } });
    if (!existing) return res.status(404).json({ error: "Assignment not found" });
    if (existing.course.uploadedBy !== req.userId) return res.status(403).json({ error: "You can only delete exams for your own courses" });
    await prisma.assignment.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete assignment" });
  }
}
