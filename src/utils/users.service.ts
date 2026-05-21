import prisma from '../config/prisma.js'
import { Role } from '@prisma/client'

export const getAllUsers = async (adminId: string) => {
  const users = await prisma.user.findMany({
    where: { id: { not: adminId } },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      location: true,
      profilePicture: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  }) as any[]

  return users
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

export const updateUserRole = async (userId: string, role: Role) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  })
  return user
}

export const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  await prisma.user.delete({ where: { id: userId } })
  return { message: 'User deleted successfully' }
}
export const toggleUserActive = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !( user as any).isActive },
    select: {
      id: true,
      fullName: true,
      email: true,
      isActive: true,
    },
  }) as any

  return {
    message: `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
    user: updated,
  }
}