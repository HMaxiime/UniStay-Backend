import { Router } from 'express'
import {
  register,
  login,
  getMe,
  updateProfileHandler,
  updateProfilePictureHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getUserByIdHandler,
} from './controller.js'
import { authenticate } from '../../middleware/auth.js'
import { upload } from '../../middleware/upload.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/forgot-password', forgotPasswordHandler)
router.post('/reset-password', resetPasswordHandler)

router.get('/me', authenticate, getMe)
router.put('/profile', authenticate, updateProfileHandler)
router.put('/profile/picture', authenticate, upload.single('profilePicture'), updateProfilePictureHandler)
router.put('/change-password', authenticate, changePasswordHandler)
router.get('/profile/:id', authenticate, getUserByIdHandler)

export default router