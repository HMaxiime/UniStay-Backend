import type { Request, Response } from 'express'
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  toggleUserActive,
} from '../utils/users.service.js'
import { Role } from '@prisma/client'

export const getAllUsersHandler = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers(req.user!.id)
    return res.status(200).json({ users })
  } catch (error: any) {
    return res.status(500).json({ message: error.message })
  }
}

export const getUserByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    const user = await getUserById(id)
    return res.status(200).json({ user })
  } catch (error: any) {
    return res.status(404).json({ message: error.message })
  }
}

export const updateUserRoleHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    const { role } = req.body
    if (!role) {
      return res.status(400).json({ message: 'Role is required' })
    }
    const allowedRoles = ['STUDENT', 'HOST', 'EMPLOYER', 'ADMIN']
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }
    const user = await updateUserRole(id, role as Role)
    return res.status(200).json({ message: 'User role updated successfully', user })
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export const toggleUserActiveHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    if (id === req.user!.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' })
    }
    const result = await toggleUserActive(id)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(404).json({ message: error.message })
  }
}

export const deleteUserHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string
    const result = await deleteUser(id)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(404).json({ message: error.message })
  }
}