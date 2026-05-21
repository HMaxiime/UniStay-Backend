import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { PrismaClient, Role } from '@prisma/client'
import { sendResetEmail } from '../../config/email.js'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey123'

export const registerUser = async (data: {
  fullName: string
  email: string
  password: string
  phone?: string | null
  location?: string | null
  role: Role
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existing) throw new Error('Email already in use')

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      phone: data.phone ?? null,
      location: data.location ?? null,
      role: data.role,
    },
  })

  return { id: user.id, email: user.email, role: user.role }
}

export const loginUser = async (data: {
  email: string
  password: string
}) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (!user) throw new Error('Invalid email or password')

  const isMatch = await bcrypt.compare(data.password, user.password)
  if (!isMatch) throw new Error('Invalid email or password')

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { token, user: { id: user.id, email: user.email, role: user.role } }
}

export const updateProfile = async (
  userId: string,
  data: {
    fullName?: string
    phone?: string | null
    location?: string | null
  }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      location: true,
      profilePicture: true,
      role: true,
    },
  })

  return user
}

export const changePassword = async (
  userId: string,
  data: { oldPassword: string; newPassword: string }
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const isMatch = await bcrypt.compare(data.oldPassword, user.password)
  if (!isMatch) throw new Error('Old password is incorrect')

  const hashed = await bcrypt.hash(data.newPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  })

  return { message: 'Password changed successfully' }
}

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) return { message: 'If that email exists, a reset link has been sent' }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry } as any,
  })

  await sendResetEmail(email, resetToken)

  return { message: 'If that email exists, a reset link has been sent' }
}

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  } as any)

  if (!user) throw new Error('Invalid or expired reset token')

  const hashed = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
    } as any,
  })

  return { message: 'Password reset successfully' }
}

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      location: true,
      profilePicture: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) throw new Error('User not found')
  return user
}