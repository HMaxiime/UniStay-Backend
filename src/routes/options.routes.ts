import express, { type RequestHandler } from "express";
import {
  createOption,
  deleteOption,
  updateOption,
} from "../controllers/options.controller.js";
import { authenticate, requireInstructor } from "../middleware/auth.middleware.js";

const router = express.Router();
const auth = authenticate as RequestHandler;
router.post("/", auth, requireInstructor, createOption);
router.put("/:id", auth, requireInstructor, updateOption);
router.delete("/:id", auth, requireInstructor, deleteOption);

export default router;
