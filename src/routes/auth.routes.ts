import express, { type RequestHandler } from "express";
<<<<<<< HEAD
import { register, login, getMe } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
=======
import { register, login, getMe, updateProfileHandler, changePasswordHandler, forgotPasswordHandler, resetPasswordHandler } from '../controllers/auth.controller.js'
import {authenticate}  from '../middleware/auth.middleware.js'
>>>>>>> main

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get(
  "/me",
  authenticate as RequestHandler,
  getMe as unknown as RequestHandler,
);

<<<<<<< HEAD
export default router;
=======
router.post('/register', register)
router.post('/login', login)
router.get('/me', authenticate as RequestHandler, getMe)
router.put('/me', authenticate as RequestHandler, updateProfileHandler)
router.post("/change-password", authenticate as RequestHandler, changePasswordHandler)
router.post("/forgot-password", forgotPasswordHandler)
router.post("/reset-password", resetPasswordHandler)

export default router
>>>>>>> main
