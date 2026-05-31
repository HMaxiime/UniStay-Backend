import express, { type RequestHandler } from "express";
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  updateQuestion,
} from "../controllers/questions.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
const auth = authenticate as RequestHandler;

router.post("/",  createQuestion);
router.get("/:id", getQuestionById);
router.put("/:id", auth, updateQuestion);
router.delete("/:id", auth, deleteQuestion);

export default router;
