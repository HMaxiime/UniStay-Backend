import type { Request, Response } from "express";
import { submitAssignmentSchema } from "../validators/learning.validator.js";
import { submitAssignment } from "../utils/learning.service.js";

export async function submitStudentAnswers(req: Request, res: Response) {
  try {
    const data = submitAssignmentSchema.parse(req.body);
<<<<<<< HEAD
    const userId = req.user?.id ?? data.userId;
    if (!userId) return res.status(400).json({ error: "userId is required" });
=======
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Authentication required" });
>>>>>>> main

    const result = await submitAssignment(userId, data.assignmentResultId, data.answers);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message ?? "Failed to submit answers" });
  }
}
