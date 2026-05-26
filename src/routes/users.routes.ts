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

router.get('/', auth, admin, getAllUsersHandler )
router.get('/:id', auth, admin, getUserByIdHandler )
router.patch('/:id/role', auth, admin, updateUserRoleHandler )
router.patch('/:id/active', auth, admin, toggleUserActiveHandler )
router.delete('/:id', auth, admin, deleteUserHandler )

export default router
