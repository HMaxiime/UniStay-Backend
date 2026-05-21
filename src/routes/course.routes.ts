import express from "express";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  publishCourse,
  updateCourse,
} from "../controllers/course.controller.js";


const router = express.Router();

router.post("/", createCourse);
router.get("/", getCourses);
router.get("/:id", getCourseById);
router.put("/:id",updateCourse);
router.delete("/:id", deleteCourse);
router.put("/:id/publish", publishCourse);

export default router;