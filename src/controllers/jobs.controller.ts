import type { Request, Response } from "express";

import prisma from "../config/prisma.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { createJobSchema } from "../validators/jobs.validator.js";

export async function getJobs(req: Request, res: Response): Promise<void> {
  try {
    const { location, scheduleType, page = "1", limit = "10" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filters: Record<string, unknown> = {};
    if (location) {
      filters.location = { contains: String(location), mode: "insensitive" };
    }
    if (scheduleType) {
      filters.scheduleType = String(scheduleType).toUpperCase();
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: filters,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          employer: { select: { id: true, fullName: true, email: true } },
          jobSkills: { include: { skill: true } },
        },
      }),
      prisma.job.count({ where: filters }),
    ]);

    res.status(200).json({
      success: true,
      data: jobs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
}

export async function getJobById(req: Request, res: Response): Promise<void> {
  try {
    const jobId = req.params.id as string;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: { select: { id: true, fullName: true, email: true } },
        jobSkills: { include: { skill: true } },
      },
    });

    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ success: false, message: "Failed to fetch job" });
  }
}

export async function createJob(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    const userRole = authReq.role;

    if (userRole !== "EMPLOYER" && userRole !== "ADMIN") {
      res
        .status(403)
        .json({ success: false, message: "Only employers can create jobs" });
      return;
    }

    const parsed = createJobSchema.parse(req.body);

    const job = await prisma.job.create({
      data: {
        title: parsed.title,
        location: parsed.location,
        salary: parsed.salary,
        scheduleType: parsed.scheduleType,
        employerId: userId,
      },
    });

    res.status(201).json({ success: true, message: "Job created", data: job });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, message: "Failed to create job" });
  }
}

export async function updateJob(req: Request, res: Response): Promise<void> {
  try {
    const jobId = req.params.id as string;
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    const userRole = authReq.role;

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    if (userRole !== "ADMIN" && existing.employerId !== userId) {
      res.status(403).json({ success: false, message: "Unauthorized" });
      return;
    }

    const parsed = createJobSchema.parse(req.body);

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: parsed.title,
        location: parsed.location,
        salary: parsed.salary,
        scheduleType: parsed.scheduleType,
      },
    });

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ success: false, message: "Failed to update job" });
  }
}

export async function deleteJob(req: Request, res: Response): Promise<void> {
  try {
    const jobId = req.params.id as string;
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    const userRole = authReq.role;

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    if (userRole !== "ADMIN" && existing.employerId !== userId) {
      res.status(403).json({ success: false, message: "Unauthorized" });
      return;
    }

    await prisma.job.delete({ where: { id: jobId } });
    res.status(200).json({ success: true, message: "Job deleted" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
}
