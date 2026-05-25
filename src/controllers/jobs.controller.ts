import prisma from "../config/prisma.js";
import type { Request, Response } from "express";
import { createJobSchema } from "../validators/jobs.validator.js";

export async function getJobs(_req: Request, res: Response) {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        employer: { select: { id: true, fullName: true, email: true } },
        jobSkills: { include: { skill: true } },
      },
    });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}

export async function getJobById(req: Request, res: Response) {
  try {
    const jobId = req.params.id as string;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: { select: { id: true, fullName: true, email: true } },
        jobSkills: { include: { skill: true } },
      },
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
}

export async function createJob(req: Request, res: Response) {
  try {
    const parsed = createJobSchema.parse(req.body);
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user?.role !== "EMPLOYER" && req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Only employers can create jobs" });
    }

    const job = await prisma.job.create({
      data: {
        title: parsed.title,
        location: parsed.location,
        salary: parsed.salary,
        scheduleType: parsed.scheduleType as any,
        employerId,
      },
    });
    res.status(201).json(job);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
}

export async function updateJob(req: Request, res: Response) {
  try {
    const jobId = req.params.id as string;
    const parsed = createJobSchema.parse(req.body);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Ensure job exists
    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) return res.status(404).json({ error: "Job not found" });

    if (userRole !== "ADMIN" && existing.employerId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this job" });
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: parsed.title,
        location: parsed.location,
        salary: parsed.salary,
        scheduleType: parsed.scheduleType as any,
      },
    });
    res.json(job);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
}

export async function deleteJob(req: Request, res: Response) {
  try {
    const jobId = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) return res.status(404).json({ error: "Job not found" });

    if (userRole !== "ADMIN" && existing.employerId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this job" });
    }

    await prisma.job.delete({ where: { id: jobId } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Failed to delete job" });
  }
}
