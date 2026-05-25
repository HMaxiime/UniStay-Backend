import express from "express";
import upload from "../config/multer.js";
import {
  deleteUpload,
  getUploadById,
  getUploads,
  uploadFile,
} from "../controllers/uploads.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/uploads:
 *   get:
 *     summary: List uploaded files
 *     tags: [Uploads]
 *     responses:
 *       200:
 *         description: Uploads list
 *   post:
 *     summary: Upload a file
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               materialId:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded
 * /api/uploads/{id}:
 *   get:
 *     summary: Get uploaded file by ID
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upload found
 *   delete:
 *     summary: Delete uploaded file
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upload deleted
 */
router.post("/", upload.single("file"), uploadFile);
router.get("/", getUploads);
router.get("/:id", getUploadById);
router.delete("/:id", deleteUpload);

export default router;
