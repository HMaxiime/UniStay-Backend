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
  const hashedEmployerPassword = await bcrypt.hash("Employer@123", 10)
  const employer= await prisma.user.create({
    data: {
      fullName: "UniStay Employer",
      email: "employer@unistay.com",
      password: hashedEmployerPassword,
      role: "EMPLOYER",
    },
  })
const hashedHostPassword = await bcrypt.hash('Host@123', 10)
  const host = await prisma.user.create({
  data: {
    fullName: "UniStay Host",
    email: "host@unistay.com",
    password: hashedHostPassword,
    role: "HOST",
  }
})
const hashedStudentPassword = await bcrypt.hash("Student@123", 10)
const student = await prisma.user.create({
  data:{
    fullName: "unistay student",
    email:"student@unistay.com",
    password: hashedStudentPassword,
    role: "STUDENT",
  }
})

  console.log('Admin created successfully:', admin.email)
  console.log('Employer created successfully:', employer.email)
  console.log('Host created successfully:', host.email)
  console.log('student created successfully:', student.email)
}


main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
