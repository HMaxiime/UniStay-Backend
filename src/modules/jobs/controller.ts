import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { createJobSchema } from "../../validators/jobs.validator.js";

// ─── GET ALL JOBS (public) ──────────────────────────────────────────────────
export const getJobs = async (req: Request, res: Response) => {
  try {
    const { location, scheduleType, page = "1", limit = "10" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filters: any = {};
    if (location)
      filters.location = { contains: String(location), mode: "insensitive" };
    if (scheduleType) filters.scheduleType = String(scheduleType).toUpperCase();

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

    return res
      .status(200)
      .json({
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
    console.error("modules.jobs.getJobs error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── GET JOB BY ID (public) ─────────────────────────────────────────────────
export const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        employer: { select: { id: true, fullName: true, email: true } },
        jobSkills: { include: { skill: true } },
      },
    });
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });
    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error("modules.jobs.getJobById error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── CREATE JOB (Employer / Admin) ──────────────────────────────────────────
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== "EMPLOYER" && userRole !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Only employers can create jobs" });
    }

    const parsed = createJobSchema.parse(req.body);

    const job = await prisma.job.create({
      data: {
        title: parsed.title,
        location: parsed.location,
        salary: parsed.salary,
        scheduleType: parsed.scheduleType as any,
        employerId: userId!,
      },
    });

    return res
      .status(201)
      .json({ success: true, message: "Job created", data: job });
  } catch (error) {
    console.error("modules.jobs.createJob error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── UPDATE JOB (Employer / Admin) ──────────────────────────────────────────
export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ success: false, message: "Job not found" });

    if (userRole !== "ADMIN" && existing.employerId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const parsed = createJobSchema.parse(req.body);

    const updated = await prisma.job.update({
      where: { id },
      data: {
        title: parsed.title,
        location: parsed.location,
        salary: parsed.salary,
        scheduleType: parsed.scheduleType as any,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("modules.jobs.updateJob error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ─── DELETE JOB (Employer / Admin) ──────────────────────────────────────────
export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ success: false, message: "Job not found" });

    if (userRole !== "ADMIN" && existing.employerId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await prisma.job.delete({ where: { id } });
    return res.status(200).json({ success: true, message: "Job deleted" });
  } catch (error) {
    console.error("modules.jobs.deleteJob error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export default {};
