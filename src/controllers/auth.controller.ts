<<<<<<< HEAD
import type { Request, Response } from "express";
import { registerUser, loginUser } from "../utils/auth.service.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
=======
import type { Response } from 'express'
import {
  registerUser,
  loginUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getUserById,
} from '../utils/auth.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'
>>>>>>> main

const ALLOWED_ROLES = ["STUDENT", "HOST", "EMPLOYER"];

export const register = async (req: AuthRequest, res: Response) => {
  try {
<<<<<<< HEAD
    const { fullName, email, password, phone, location, role } = req.body;

=======
    const { fullName, email, password, phone, location, role } = req.body
>>>>>>> main
    if (!fullName || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "fullName, email, password and role are required" });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ message: "Role must be STUDENT, HOST, or EMPLOYER" });
    }
<<<<<<< HEAD

    const user = await registerUser({
      fullName,
      email,
      password,
      phone,
      location,
      role,
    });
    return res
      .status(201)
      .json({ message: "User registered successfully", user });
=======
    const user = await registerUser({ fullName, email, password, phone, location, role })
    return res.status(201).json({ message: 'User registered successfully', user })
>>>>>>> main
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
<<<<<<< HEAD
    const { email, password } = req.body;

=======
    const { email, password } = req.body
>>>>>>> main
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
<<<<<<< HEAD

    const result = await loginUser({ email, password });
    return res.status(200).json({ message: "Login successful", ...result });
=======
    const result = await loginUser({ email, password })
    return res.status(200).json({ message: 'Login successful', ...result })
>>>>>>> main
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

<<<<<<< HEAD
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({ user: req.user });
};
=======
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
   const user = await getUserById(req.userId)
    return res.status(200).json({ user })
  } catch (error: any) {
    return res.status(404).json({ message: error.message })
  }
}

export const updateProfileHandler = async (req: AuthRequest, res: Response) => {

  try {
    const { fullName, phone, location } = req.body
    const user = await updateProfile(req.userId, { fullName, phone, location })
    return res.status(200).json({ message: 'Profile updated successfully', user })
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export const changePasswordHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'oldPassword and newPassword are required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }
   const result = await changePassword(req.userId, { oldPassword, newPassword })
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export const forgotPasswordHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }
    const result = await forgotPassword(email)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export const resetPasswordHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'token and newPassword are required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    const result = await resetPassword(token, newPassword)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export const getUserByIdHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string
    const user = await getUserById(id)
    return res.status(200).json({ user })
  } catch (error: any) {
    return res.status(404).json({ message: error.message })
  }
}
>>>>>>> main
