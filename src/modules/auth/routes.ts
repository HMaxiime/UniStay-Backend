import { Router } from 'express'
import {
  register,
  login,
  getMe,
  updateProfileHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getUserByIdHandler,
} from './controller.js'
import { authenticate } from '../../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/forgot-password', forgotPasswordHandler)
router.post('/reset-password', resetPasswordHandler)

router.get('/me', authenticate, getMe)
router.put('/profile', authenticate, updateProfileHandler)
router.put('/change-password', authenticate, changePasswordHandler)
router.get('/profile/:id', authenticate, getUserByIdHandler)

export default router