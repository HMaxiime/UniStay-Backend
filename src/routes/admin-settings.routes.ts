import { Router } from "express";
import {
  getActivityLogs,
  getSystemSettings,
  updateSystemSettings,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from "../controllers/admin-settings.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/logs", authenticate, getActivityLogs);
router.get("/settings", authenticate, getSystemSettings);
router.put("/settings", authenticate, updateSystemSettings);
router.post("/announcements", authenticate, createAnnouncement);
router.get("/announcements", optionalAuthenticate, getAnnouncements);
router.delete("/announcements/:id", authenticate, deleteAnnouncement);

export default router;
