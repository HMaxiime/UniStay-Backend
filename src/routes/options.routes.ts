import express from "express";
import {
  createOption,
  deleteOption,
  updateOption,
} from "../controllers/options.controller.js";

const router = express.Router();

router.post("/", createOption);
router.put("/:id", updateOption);
router.delete("/:id", deleteOption);

export default router;
