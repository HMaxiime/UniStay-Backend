import express, { type RequestHandler } from "express";
import upload from "../config/multer.js";
import {
  deleteMaterialFile,
  uploadMaterialFile,
  uploadMaterialFiles,
} from "../controllers/uploads.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate as unknown as RequestHandler);

router.post(
  "/materials/:id",
  upload.single("file"),
  uploadMaterialFile as unknown as RequestHandler
);
router.post(
  "/materials/:id/many",
  upload.array("files", 10),
  uploadMaterialFiles as unknown as RequestHandler
);
router.delete(
  "/material-files/:id",
  deleteMaterialFile as unknown as RequestHandler
);

export default router;
