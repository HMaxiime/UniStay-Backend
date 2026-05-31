import type { Request, Response } from "express";

import prisma from "../config/prisma.js";
import { createJobSchema } from "../validators/jobs.validator.js";

<<<<<<< HEAD
export async function getJobs(req: Request, res: Response): Promise<void> {
=======
export async function getJobs(_req: Request, res: Response) {
>>>>>>> main
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

<<<<<<< HEAD
export async function createJob(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
=======
export async function createJob(req: Request, res: Response) {
  try {
    const parsed = createJobSchema.parse(req.body);
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user?.role !== "EMPLOYER" && req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Only employers can create jobs" });
>>>>>>> main
    }
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

<<<<<<< HEAD
export async function updateJob(req: Request, res: Response): Promise<void> {
  try {
    const jobId = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;
=======
export async function updateJob(req: Request, res: Response) {
  try {
    const jobId = req.params.id as string;
    const parsed = createJobSchema.parse(req.body);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
>>>>>>> main

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
<<<<<<< HEAD
    if (!existing) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
=======
    if (!existing) return res.status(404).json({ error: "Job not found" });

    if (userRole !== "ADMIN" && existing.employerId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this job" });
>>>>>>> main
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

<<<<<<< HEAD
export async function deleteJob(req: Request, res: Response): Promise<void> {
=======
export async function deleteJob(req: Request, res: Response) {
>>>>>>> main
  try {
    const jobId = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;
<<<<<<< HEAD

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    if (userRole !== "ADMIN" && existing.employerId !== userId) {
      res.status(403).json({ success: false, message: "Unauthorized" });
      return;
=======

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) return res.status(404).json({ error: "Job not found" });

    if (userRole !== "ADMIN" && existing.employerId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this job" });
>>>>>>> main
    }

    await prisma.job.delete({ where: { id: jobId } });
    res.status(200).json({ success: true, message: "Job deleted" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
}
