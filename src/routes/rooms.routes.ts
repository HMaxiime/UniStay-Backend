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
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
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

export default router;
