import prisma from "../config/prisma.js";
import type { Request, Response } from "express";
import { createCourseSchema, updateCourseSchema } from "../validators/course.validator.js";
import { ZodError } from "zod";

const courseInclude = {
  materials: true,
  skills: { include: { skill: true } },
  assignments: true,
};

export async function getCourses(req: Request, res: Response) {
  try {
    const courses = await prisma.course.findMany({ include: courseInclude });
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
}

export async function getCourseById(req: Request, res: Response) {
  try {
    const courseId = req.params.id as string;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: courseInclude,
    });
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
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const parsed = createCourseSchema.parse(req.body);
    const { skillIds, ...courseFields } = parsed;
    const createData: {
      title: string;
      uploadedBy: string;
      description?: string;
      thumbnail?: string;
      category?: string;
    } = {
      title: courseFields.title,
      uploadedBy: req.userId,
    };

    if (courseFields.description !== undefined) {
      createData.description = courseFields.description;
    }
    if (courseFields.thumbnail !== undefined) {
      createData.thumbnail = courseFields.thumbnail;
    }
    if (courseFields.category !== undefined) {
      createData.category = courseFields.category;
    }

    const uniqueSkillIds = [...new Set(skillIds ?? [])];
    if (uniqueSkillIds.length > 0) {
      const existingSkills = await prisma.skill.findMany({
        where: { id: { in: uniqueSkillIds } },
        select: { id: true },
      });
      const existingSkillIds = new Set(existingSkills.map((skill) => skill.id));
      const missingSkillIds = uniqueSkillIds.filter((skillId) => !existingSkillIds.has(skillId));

      if (missingSkillIds.length > 0) {
        return res.status(400).json({ error: "Some skills do not exist", missingSkillIds });
      }
    }

    const course = await prisma.course.create({
      data: {
        ...createData,
        skills: {
          create: uniqueSkillIds.map((skillId) => ({ skillId })),
        },
      },
      include: courseInclude,
    });
    res.status(201).json(course);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Invalid course data", details: error.issues });
    }

    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
}

export async function updateCourse(req: Request, res: Response) {
  try {
    const courseId = req.params.id as string;
    const parsed = updateCourseSchema.parse(req.body);
    const { skillIds, ...courseFields } = parsed;
    const updateData: Record<string, unknown> = {};

    if (courseFields.title !== undefined) {
      updateData.title = courseFields.title;
    }
    if (courseFields.description !== undefined) {
      updateData.description = courseFields.description;
    }
    if (courseFields.thumbnail !== undefined) {
      updateData.thumbnail = courseFields.thumbnail;
    }
    if (courseFields.category !== undefined) {
      updateData.category = courseFields.category;
    }

    const existingCourse = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existingCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (skillIds !== undefined) {
      const uniqueSkillIds = [...new Set(skillIds)];
      const existingSkills = await prisma.skill.findMany({
        where: { id: { in: uniqueSkillIds } },
        select: { id: true },
      });
      const existingSkillIds = new Set(existingSkills.map((skill) => skill.id));
      const missingSkillIds = uniqueSkillIds.filter((skillId) => !existingSkillIds.has(skillId));

      if (missingSkillIds.length > 0) {
        return res.status(400).json({ error: "Some skills do not exist", missingSkillIds });
      }
    }

    const course = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.course.update({
          where: { id: courseId },
          data: updateData,
        });
      }

      if (skillIds !== undefined) {
        const uniqueSkillIds = [...new Set(skillIds)];

        await tx.courseSkill.deleteMany({ where: { courseId } });

        if (uniqueSkillIds.length > 0) {
          await tx.courseSkill.createMany({
            data: uniqueSkillIds.map((skillId) => ({ courseId, skillId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.course.findUniqueOrThrow({
        where: { id: courseId },
        include: courseInclude,
      });
    });

    res.json(course);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Invalid course data", details: error.issues });
    }

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

export async function publishCourse(req: Request, res: Response) {
  try {
    const courseId = req.params.id as string;
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: true },
      include: courseInclude,
    });
    res.json(course);
  } catch (error) {
    console.error("Error publishing course:", error);
    res.status(500).json({ error: "Failed to publish course" });
  }
}
