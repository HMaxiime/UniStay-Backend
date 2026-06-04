import prisma from "../config/prisma.js";
import type { Request, Response } from "express";
import { sendEmail } from "../config/email.js";
import { createNotification } from "../services/notifications.service.js";
import {
  jobApplicationSubmittedEmail,
  jobApplicationReceivedEmail,
  jobApplicationAcceptedEmail,
  jobApplicationRejectedEmail,
} from "../templates/email.templates.js";

// ── Apply to a job ────────────────────────────────────────────────────────────

export async function applyToJob(req: Request, res: Response) {
  try {
    const jobId = req.params.jobId as string;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user?.role !== "STUDENT") {
      return res
        .status(403)
        .json({ error: "Only students can apply for jobs" });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const existingApplication = await prisma.application.findFirst({
      where: { userId, jobId },
    });
    if (existingApplication) {
      return res
        .status(409)
        .json({ error: "You have already applied for this job" });
    }

    const { message } = req.body ?? {};

    const application = await prisma.application.create({
      data: { userId, jobId, ...(message ? { message: String(message) } : {}) },
      include: {
        user: { select: { fullName: true, email: true } },
        job: {
          include: {
            employer: { select: { id: true, fullName: true, email: true } },
            jobSkills: { include: { skill: true } },
          },
        },
      },
    });

    // Fire confirmation email in the background — do NOT await, response must not be blocked
    const emailContent = jobApplicationSubmittedEmail(
      application.user.fullName,
      job.title,
      job.employer?.fullName ?? "the employer",
    );
    sendEmail(application.user.email, emailContent.subject, emailContent).catch(
      (err) =>
        console.error(
          "[applications] Failed to send application-submitted email:",
          err,
        ),
    );

    const employerNotification = jobApplicationReceivedEmail(
      job.employer.fullName,
      application.user.fullName,
      application.user.email,
      job.title,
      job.employer.fullName,
      application.message ?? undefined,
    );

    sendEmail(
      job.employer.email,
      employerNotification.subject,
      employerNotification,
    ).catch((err) =>
      console.error(
        "[applications] Failed to send employer application email:",
        err,
      ),
    );

    await createNotification({
      userId: job.employer.id,
      type: "JOB_APPLICATION_CREATED",
      title: "New job application",
      message: `${application.user.fullName} applied for ${job.title}`,
      data: {
        applicationId: application.id,
        jobId: job.id,
        studentId: application.userId,
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

// ── Get my applications (student) ─────────────────────────────────────────────

export async function getMyJobApplications(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user?.role !== "STUDENT") {
      return res
        .status(403)
        .json({ error: "Only students can view their job applications" });
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

// ── Get applications for a job (employer / admin) ─────────────────────────────

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
      return res
        .status(403)
        .json({ error: "Not authorized to view applications for this job" });
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
            avatar: true,
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

// ── Get applications for all jobs owned by an employer ───────────────────────

export async function getEmployerApplications(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (userRole !== "EMPLOYER") {
      return res
        .status(403)
        .json({ error: "Only employers can view received applications" });
    }

    const applications = await prisma.application.findMany({
      where: { job: { employerId: userId } },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            location: true,
            avatar: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            salary: true,
            scheduleType: true,
            deadline: true,
            createdAt: true,
          },
        },
      },
    });

    return res.json(applications);
  } catch (error) {
    console.error("Error fetching employer applications:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch employer applications" });
  }
}

// ── Update application status (employer / admin) ──────────────────────────────

export async function updateJobApplicationStatus(req: Request, res: Response) {
  try {
    const applicationId = req.params.applicationId as string;
    const { status, message } = req.body; // message is optional employer note
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!["PENDING", "ACCEPTED", "REJECTED"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status must be PENDING, ACCEPTED, or REJECTED" });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: { employer: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!application)
      return res.status(404).json({ error: "Application not found" });

    // Only the owning employer or an admin can change the status
    if (userRole !== "ADMIN" && application.job.employerId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this application" });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        job: { include: { employer: { select: { fullName: true } } } },
      },
    });

    // Fire status email in the background — do NOT await
    const studentName = updated.user.fullName;
    const jobTitle = updated.job.title;
    const companyName = updated.job.employer?.fullName ?? "the employer";
    const studentEmail = updated.user.email;

    if (status === "ACCEPTED") {
      const emailContent = jobApplicationAcceptedEmail(
        studentName,
        jobTitle,
        companyName,
        message as string | undefined,
      );
      sendEmail(studentEmail, emailContent.subject, emailContent).catch((err) =>
        console.error("[applications] Failed to send accepted email:", err),
      );
    } else if (status === "REJECTED") {
      const emailContent = jobApplicationRejectedEmail(
        studentName,
        jobTitle,
        companyName,
      );
      sendEmail(studentEmail, emailContent.subject, emailContent).catch((err) =>
        console.error("[applications] Failed to send rejected email:", err),
      );
    }

    return res.json({
      message: "Application status updated successfully",
      application: updated,
    });
  } catch (error) {
    console.error("Error updating job application:", error);
    return res.status(500).json({ error: "Failed to update job application" });
  }
}
