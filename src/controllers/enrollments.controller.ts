import type { Response , Request } from "express";
import prisma from "../config/prisma.js";
import { createEnrollmentSchema } from "../validators/learning.validator.js";

export async function createEnrollment(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const data = createEnrollmentSchema.parse(req.body);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId: data.courseId },
      include: { course: true, user: { select: { id: true, fullName: true, email: true } } },
    });
    res.status(201).json(enrollment);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to create enrollment" });
  }
}
