import prisma from '../config/prisma.js'
import type { Request, Response } from 'express'
import { sendEmail } from '../config/email.js'
import {
  jobApplicationSubmittedEmail,
  jobApplicationAcceptedEmail,
  jobApplicationRejectedEmail,
} from '../templates/email.templates.js'

// ── Apply to a job ────────────────────────────────────────────────────────────

export async function applyToJob(req: Request, res: Response) {
  try {
    const jobId = req.params.jobId as string
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (req.user?.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can apply for jobs' })
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: { select: { fullName: true } } },
    })
    if (!job) return res.status(404).json({ error: 'Job not found' })

    const existingApplication = await prisma.application.findFirst({
      where: { userId, jobId },
    })
    if (existingApplication) {
      return res.status(409).json({ error: 'You have already applied for this job' })
    }

    const application = await prisma.application.create({
      data: { userId, jobId },
      include: {
        user: { select: { fullName: true, email: true } },
        job: {
          include: {
            employer: { select: { id: true, fullName: true, email: true } },
            jobSkills: { include: { skill: true } },
          },
        },
      },
    })

    // Send confirmation email to the student — best-effort
    try {
      const emailContent = jobApplicationSubmittedEmail(
        application.user.fullName,
        job.title,
        job.employer?.fullName ?? 'the employer',
      )
      await sendEmail(application.user.email, emailContent.subject, emailContent)
    } catch (mailError) {
      console.error('[applications] Failed to send application-submitted email:', mailError)
    }

    return res.status(201).json({
      message: 'Job application submitted successfully',
      application,
    })
  } catch (error) {
    console.error('Error applying to job:', error)
    return res.status(500).json({ error: 'Failed to apply for job' })
  }
}

// ── Get my applications (student) ─────────────────────────────────────────────

export async function getMyJobApplications(req: Request, res: Response) {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (req.user?.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can view their job applications' })
    }

    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            employer: { select: { id: true, fullName: true, email: true } },
            jobSkills: { include: { skill: true } },
          },
        },
      },
    })

    return res.json(applications)
  } catch (error) {
    console.error('Error fetching my job applications:', error)
    return res.status(500).json({ error: 'Failed to fetch job applications' })
  }
}

// ── Get applications for a job (employer / admin) ─────────────────────────────

export async function getJobApplications(req: Request, res: Response) {
  try {
    const jobId = req.params.jobId as string
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) return res.status(404).json({ error: 'Job not found' })

    if (userRole !== 'ADMIN' && job.employerId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view applications for this job' })
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
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
    })

    return res.json(applications)
  } catch (error) {
    console.error('Error fetching job applications:', error)
    return res.status(500).json({ error: 'Failed to fetch job applications' })
  }
}

// ── Update application status (employer / admin) ──────────────────────────────

export async function updateJobApplicationStatus(req: Request, res: Response) {
  try {
    const applicationId = req.params.applicationId as string
    const { status, message } = req.body          // message is optional employer note
    const userId = req.user?.id
    const userRole = req.user?.role

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be PENDING, ACCEPTED, or REJECTED' })
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { include: { employer: { select: { id: true, fullName: true } } } } },
    })
    if (!application) return res.status(404).json({ error: 'Application not found' })

    // Only the owning employer or an admin can change the status
    if (userRole !== 'ADMIN' && application.job.employerId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this application' })
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        job: { include: { employer: { select: { fullName: true } } } },
      },
    })

    // Send status-change email to the student — best-effort
    try {
      const studentName = updated.user.fullName
      const jobTitle    = updated.job.title
      const companyName = updated.job.employer?.fullName ?? 'the employer'
      const studentEmail = updated.user.email

      if (status === 'ACCEPTED') {
        const emailContent = jobApplicationAcceptedEmail(
          studentName,
          jobTitle,
          companyName,
          message as string | undefined,
        )
        await sendEmail(studentEmail, emailContent.subject, emailContent)
      } else if (status === 'REJECTED') {
        const emailContent = jobApplicationRejectedEmail(studentName, jobTitle, companyName)
        await sendEmail(studentEmail, emailContent.subject, emailContent)
      }
    } catch (mailError) {
      console.error('[applications] Failed to send application-status email:', mailError)
    }

    return res.json({
      message: 'Application status updated successfully',
      application: updated,
    })
  } catch (error) {
    console.error('Error updating job application:', error)
    return res.status(500).json({ error: 'Failed to update job application' })
  }
}
