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

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 *       403:
 *         description: Admin only
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleUpdateInput'
 *     responses:
 *       200:
 *         description: Role updated
 * /api/users/{id}/active:
 *   patch:
 *     summary: Activate or deactivate user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User active status updated
 */
router.get('/', auth, admin, getAllUsersHandler )
router.get('/:id', auth, admin, getUserByIdHandler )
router.patch('/:id/role', auth, admin, updateUserRoleHandler )
router.patch('/:id/active', auth, admin, toggleUserActiveHandler )
router.delete('/:id', auth, admin, deleteUserHandler )

export default router
