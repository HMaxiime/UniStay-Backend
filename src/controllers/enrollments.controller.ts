import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { createEnrollmentSchema } from "../validators/learning.validator.js";
import { getUserLearningProfile } from "../utils/learning.service.js";

export async function createEnrollment(req: Request, res: Response) {
  try {
    const data = createEnrollmentSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId: data.courseId },
      include: { course: true, user: { select: { id: true, fullName: true, email: true } } },
    });
    res.status(201).json(enrollment);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to create enrollment" });
  }
}

export async function getMyLearningProfile(req: Request, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ error: "Authentication required" });
    const profile = await getUserLearningProfile(req.userId);
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.json({
      ...profile,
      avatar: profile.Avatar
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch learning profile" });
  }
}

export async function getInstructorEnrollments(req: Request, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ error: "Authentication required" });
    const enrollments = await prisma.enrollment.findMany({
      where: { course: { uploadedBy: req.userId } },
      include: {
        course: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch course enrollments" });
  }
}
