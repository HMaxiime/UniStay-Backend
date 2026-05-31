import express, { type RequestHandler } from "express";
import {
  createOption,
  deleteOption,
  updateOption,
} from "../controllers/options.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
const auth = authenticate as RequestHandler;
router.post("/",createOption);
router.put("/:id", auth, updateOption);
router.delete("/:id", auth, deleteOption);

export default router;
