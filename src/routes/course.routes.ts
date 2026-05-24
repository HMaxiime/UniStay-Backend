import express from "express";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  publishCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import {authenticate} from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: List courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Courses list
 *   post:
 *     summary: Create a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       201:
 *         description: Course created
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course found
 *   put:
 *     summary: Update course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       200:
 *         description: Course updated
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Course deleted
 * /api/courses/{id}/publish:
 *   put:
 *     summary: Publish course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course published
 */
router.post("/", authenticate, createCourse);
router.get("/", getCourses);
router.get("/:id", getCourseById);
router.put("/:id", authenticate, updateCourse);
router.delete("/:id", authenticate, deleteCourse);
router.put("/:id/publish", authenticate, publishCourse);

export default router;
