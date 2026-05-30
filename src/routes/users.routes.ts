import { Router, type RequestHandler } from 'express'
import {
  getAllUsersHandler,
  getUserByIdHandler,
  updateUserRoleHandler,
  deleteUserHandler,
  toggleUserActiveHandler,
} from '../controllers/users.controller.js'
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js'

const router = Router()

const auth = authenticate as unknown as RequestHandler
const admin = requireAdmin as unknown as RequestHandler

router.get('/', auth, admin, getAllUsersHandler as unknown as RequestHandler)
router.get('/:id', auth, admin, getUserByIdHandler as unknown as RequestHandler)
router.patch('/:id/role', auth, admin, updateUserRoleHandler as unknown as RequestHandler)
router.patch('/:id/active', auth, admin, toggleUserActiveHandler as unknown as RequestHandler)
router.delete('/:id', auth, admin, deleteUserHandler as unknown as RequestHandler)

export default router