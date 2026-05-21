import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import prisma from '../config/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey123'
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10)

export const registerUser = async (data: {
  fullName: string
  email: string
  password: string
  phone?: string | null
  location?: string | null
  role: Role
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })

  if (existing) throw new Error('Email already in use')

  const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS)

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

export const loginUser = async (data: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } })

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
