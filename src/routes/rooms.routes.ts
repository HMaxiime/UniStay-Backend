import { Router } from "express";
import multer from "multer";
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  uploadRoomImages,
  deleteRoomImage,
} from "../controllers/rooms.controller.js";
import type { ErrorRequestHandler } from "express";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";

const router = Router();

const multerError: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Each image must be 10 MB or smaller" });
  }
  next(err);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", optionalAuthenticate, getRooms);
router.get("/:id", optionalAuthenticate, getRoomById);
router.post("/", authenticate, upload.array("images", 10), createRoom);
router.put("/:id", authenticate, upload.array("images", 10), updateRoom);
router.delete("/:id", authenticate, deleteRoom);
router.post("/:id/images", authenticate, upload.array("images", 10), uploadRoomImages);
router.delete("/:id/images", authenticate, deleteRoomImage);

router.use(multerError);

export default router;
