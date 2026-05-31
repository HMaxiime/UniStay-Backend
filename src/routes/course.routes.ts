import express from "express";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  publishCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import {authenticate, requireAdmin ,} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, requireAdmin, createCourse);
router.get("/", getCourses);
router.get("/:id",getCourseById);
router.put("/:id", authenticate, requireAdmin, updateCourse);
router.delete("/:id", authenticate, requireAdmin, deleteCourse);
router.put("/:id/publish", authenticate, requireAdmin, publishCourse);

export default router;
