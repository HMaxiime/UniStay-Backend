import prisma from "../config/prisma.js";
import type { Prisma } from "@prisma/client";

import type { Request, Response } from "express";
import { createCourseSchema } from "../validators/course.validator.js";

export async function getCourses(req: Request, res: Response) {
  try {
    const courses = await prisma.course.findMany();
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
}

export async function getCourseById(req: Request, res: Response) {
  try {
    const courseId = req.params.id as string;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
}

export async function createCourse(req: Request, res: Response) {
  try {
    const parsed = createCourseSchema.parse(req.body);

    const uploadedBy = req.body.uploadedBy as string | undefined;
    if (!uploadedBy) {
      return res.status(400).json({ error: "uploadedBy is required" });
    }

    const createData: Prisma.CourseCreateInput = {
      title: parsed.title,
      uploadedBy,
    };

    if (parsed.description !== undefined) {
      createData.description = parsed.description;
    }
    if (parsed.thumbnail !== undefined) {
      createData.thumbnail = parsed.thumbnail;
    }
    if (parsed.category !== undefined) {
      createData.category = parsed.category;
    }

    const course = await prisma.course.create({
      data: createData,
    });
    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
}

export async function updateCourse(req: Request, res: Response) {
  try {
    const courseId = req.params.id as string;
    const parsed = createCourseSchema.parse(req.body);
    const updateData: Record<string, unknown> = { title: parsed.title };

    if (parsed.description !== undefined) {
      updateData.description = parsed.description;
    }
    if (parsed.thumbnail !== undefined) {
      updateData.thumbnail = parsed.thumbnail;
    }
    if (parsed.category !== undefined) {
      updateData.category = parsed.category;
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });
    res.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
}

export async function deleteCourse(req: Request, res: Response) {
  try {
    const courseId = req.params.id as string;
    await prisma.course.delete({ where: { id: courseId } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
}
