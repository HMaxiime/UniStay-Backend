import express from "express";
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  updateQuestion,
} from "../controllers/questions.controller.js";

const router = express.Router();

router.post("/", createQuestion);
router.get("/:id", getQuestionById);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

export default router;
