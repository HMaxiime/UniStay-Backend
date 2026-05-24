import prisma from "../config/prisma.js";
import type { Request, Response } from "express";

export async function applyToJob(req: Request, res: Response) {
  try {
    const jobId = req.params.jobId as string;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user?.role !== "STUDENT") {
      return res.status(403).json({ error: "Only students can apply for jobs" });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const existingApplication = await prisma.application.findFirst({
      where: { userId, jobId },
    });
    if (existingApplication) {
      return res.status(409).json({ error: "You have already applied for this job" });
    }

    const application = await prisma.application.create({
      data: { userId, jobId },
      include: {
        job: {
          include: {
            employer: { select: { id: true, fullName: true, email: true } },
            jobSkills: { include: { skill: true } },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Job application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Error applying to job:", error);
    return res.status(500).json({ error: "Failed to apply for job" });
  }
}

export async function getMyJobApplications(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user?.role !== "STUDENT") {
      return res.status(403).json({ error: "Only students can view their job applications" });
    }

    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          include: {
            employer: { select: { id: true, fullName: true, email: true } },
            jobSkills: { include: { skill: true } },
          },
        },
      },
    });

    return res.json(applications);
  } catch (error) {
    console.error("Error fetching my job applications:", error);
    return res.status(500).json({ error: "Failed to fetch job applications" });
  }
}

export async function getJobApplications(req: Request, res: Response) {
  try {
    const jobId = req.params.jobId as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (userRole !== "ADMIN" && job.employerId !== userId) {
      return res.status(403).json({ error: "Not authorized to view applications for this job" });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            location: true,
            profilePicture: true,
          },
        },
      },
    });

    return res.json(applications);
  } catch (error) {
    console.error("Error fetching job applications:", error);
    return res.status(500).json({ error: "Failed to fetch job applications" });
  }
}

export async function updateJobApplicationStatus(req: Request, res: Response) {
  try {
    const applicationId = req.params.applicationId as string;
    const { status } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!["PENDING", "ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status must be PENDING, ACCEPTED, or REJECTED" });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) return res.status(404).json({ error: "Application not found" });

    if (userRole !== "ADMIN" && application.job.employerId !== userId) {
      return res.status(403).json({ error: "Not authorized to update this application" });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        job: true,
      },
    });

    return res.json({
      message: "Application status updated successfully",
      application: updated,
    });
  } catch (error) {
    console.error("Error updating job application:", error);
    return res.status(500).json({ error: "Failed to update job application" });
  }
}
