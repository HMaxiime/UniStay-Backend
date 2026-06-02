import { prisma } from "../lib/prisma.js";
import type { Request, Response } from "express";

// Helper to log audit actions
const logActivity = async (userId: string | undefined, action: string, details: string) => {
  try {
    let email: string | undefined = undefined;
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      email = u?.email;
    }
    await prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        userEmail: email ?? null,
        action,
        details,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

// ─── GET SYSTEM ACTIVITY LOGS (Admin only) ───────────────────────────────────
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { page = "1", limit = "20" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getActivityLogs error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET SYSTEM SETTINGS (Admin only) ─────────────────────────────────────────
export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const settings = await prisma.systemSetting.findMany();
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error("getSystemSettings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── UPDATE SYSTEM SETTINGS (Admin only) ──────────────────────────────────────
export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { settings } = req.body; // Array of { key, value }
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: "settings array is required" });
    }

    const updatedSettings = [];
    for (const setting of settings) {
      const { key, value } = setting;
      if (!key || value === undefined) continue;

      const updated = await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
      updatedSettings.push(updated);
    }

    await logActivity(adminId, "SETTINGS_UPDATE", `Updated system settings: ${settings.map(s => s.key).join(", ")}`);

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("updateSystemSettings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── CREATE ANNOUNCEMENT (Admin & Host only) ──────────────────────────────────
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (userRole !== "ADMIN" && userRole !== "HOST") {
      return res.status(403).json({ success: false, message: "Only admins and hosts can post announcements" });
    }

    const { title, content, targetRole } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "title and content are required" });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        targetRole: targetRole || null,
        authorId: userId,
      },
    });

    await logActivity(userId, "ANNOUNCEMENT_POSTED", `Created announcement: ${title}`);

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("createAnnouncement error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET ANNOUNCEMENTS (Public / filtered by role) ────────────────────────────
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { page = "1", limit = "10" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Filters: Target role matches user's role OR targetRole is null (all users)
    const filters: any = {
      OR: [
        { targetRole: null },
        ...(userRole ? [{ targetRole: userRole }] : []),
      ],
    };

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: filters,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, fullName: true, role: true },
          },
        },
      }),
      prisma.announcement.count({ where: filters }),
    ]);

    return res.status(200).json({
      success: true,
      data: announcements,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getAnnouncements error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── DELETE ANNOUNCEMENT (Host who owned it / Admin) ──────────────────────────
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!id) {
      return res.status(400).json({ success: false, message: "Announcement ID is required" });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    if (userRole !== "ADMIN" && announcement.authorId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    await prisma.announcement.delete({ where: { id } });

    await logActivity(userId, "ANNOUNCEMENT_DELETED", `Deleted announcement: ${announcement.title}`);

    return res.status(200).json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("deleteAnnouncement error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
