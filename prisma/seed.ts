import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../src/config/prisma.js'

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@unistay.com' },
  })

  if (existingAdmin) {
    console.log('Admin already exists')
    return
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10)

  const admin = await prisma.user.create({
    data: {
      fullName: 'UniStay Admin',
      email: 'admin@unistay.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Admin created successfully:', admin.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())