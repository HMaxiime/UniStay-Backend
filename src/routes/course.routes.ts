import express from "express";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  publishCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import { authenticate, optionalAuthenticate, requireInstructor } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, requireInstructor, createCourse);
router.get("/", optionalAuthenticate, getCourses);
router.get("/:id", optionalAuthenticate, getCourseById);
router.put("/:id", authenticate, requireInstructor, updateCourse);
router.delete("/:id", authenticate, requireInstructor, deleteCourse);
router.put("/:id/publish", authenticate, requireInstructor, publishCourse);

export default router;
