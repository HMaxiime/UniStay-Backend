import express, { type RequestHandler } from "express";
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  updateQuestion,
} from "../controllers/questions.controller.js";
import { authenticate, requireInstructor } from "../middleware/auth.middleware.js";

const router = express.Router();
const auth = authenticate as RequestHandler;

router.post("/", auth, requireInstructor, createQuestion);
router.get("/:id", getQuestionById);
router.put("/:id", auth, requireInstructor, updateQuestion);
router.delete("/:id", auth, requireInstructor, deleteQuestion);

export default router;
