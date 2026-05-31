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

export async function getAssignments(_req: Request, res: Response) {
  try {
    const assignments = await prisma.assignment.findMany({
      include: { course: true, questions: { include: { options: true } } },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
}

export async function getAssignmentById(req: Request, res: Response) {
  try {
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
    if (data.courseId) {
      const course = await prisma.course.findUnique({ where: { id: data.courseId } });
      if (!course) return res.status(404).json({ error: "Course not found" });
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
    await prisma.assignment.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete assignment" });
  }
}
