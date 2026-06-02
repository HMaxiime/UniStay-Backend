import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

async function main() {
  console.log("Cleaning database...");
  await prisma.announcement.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hostel.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  const hashedEmployerPassword = await bcrypt.hash("Employer@123", 10);
  const hashedHostPassword = await bcrypt.hash("Host@123", 10);
  const hashedStudentPassword = await bcrypt.hash("Student@123", 10);

  const admin = await prisma.user.create({
    data: {
      fullName: "UniStay Admin",
      email: "admin@unistay.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const employer = await prisma.user.create({
    data: {
      fullName: "UniStay Employer",
      email: "employer@unistay.com",
      password: hashedEmployerPassword,
      role: "EMPLOYER",
    },
  });

  const host = await prisma.user.create({
    data: {
      fullName: "UniStay Host",
      email: "host@unistay.com",
      password: hashedHostPassword,
      role: "HOST",
    },
  });

  // Create multiple students for booking / waitlist simulation
  const student1 = await prisma.user.create({
    data: {
      fullName: "Alice Student",
      email: "student@unistay.com",
      password: hashedStudentPassword,
      role: "STUDENT",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      fullName: "Bob Student",
      email: "student2@unistay.com",
      password: hashedStudentPassword,
      role: "STUDENT",
    },
  });

  const student3 = await prisma.user.create({
    data: {
      fullName: "Charlie Student",
      email: "student3@unistay.com",
      password: hashedStudentPassword,
      role: "STUDENT",
    },
  });

  const student4 = await prisma.user.create({
    data: {
      fullName: "Diana Student",
      email: "student4@unistay.com",
      password: hashedStudentPassword,
      role: "STUDENT",
    },
  });

  console.log("Seeding hostels...");
  const verifiedHostel = await prisma.hostel.create({
    data: {
      name: "Grand Campus Residence",
      location: "East Wing, Main Campus",
      description: "A premium on-campus hostel featuring state-of-the-art facilities, study halls, and high-speed Wi-Fi.",
      verificationStatus: "VERIFIED",
      hostId: host.id,
      images: [
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=600",
      ],
    },
  });

  const unverifiedHostel = await prisma.hostel.create({
    data: {
      name: "New Student Hall A",
      location: "West Sector, Campus Gate 3",
      description: "Newly constructed building with spacious single and shared rooms.",
      verificationStatus: "PENDING",
      hostId: host.id,
      images: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600",
      ],
    },
  });

  console.log("Seeding rooms...");
  // VIP Room in verified hostel (Capacity: 2 students)
  const vipRoom = await prisma.room.create({
    data: {
      hostelId: verifiedHostel.id,
      name: "VIP 101",
      category: "VIP",
      capacity: 2,
      availableBeds: 2,
      price: 350.0,
      description: "Air-conditioned premium suite with single beds, private study tables, and ensuite bathroom.",
      amenities: ["AC", "Private Bathroom", "Study Desk", "Wi-Fi", "Laundry Access"],
      images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600"],
    },
  });

  // Standard Room in verified hostel (Capacity: 4 students)
  const standardRoom = await prisma.room.create({
    data: {
      hostelId: verifiedHostel.id,
      name: "Standard 202",
      category: "STANDARD",
      capacity: 4,
      availableBeds: 0, // Mark as full to simulate waitlisting
      price: 180.0,
      description: "Comfortable shared room featuring two bunk beds and personal wardrobes.",
      amenities: ["Bunk Beds", "Shared Study Room", "Wi-Fi", "Balcony"],
      images: ["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=600"],
    },
  });

  // Budget Room in verified hostel (Capacity: 6 students)
  const budgetRoom = await prisma.room.create({
    data: {
      hostelId: verifiedHostel.id,
      name: "Budget 305",
      category: "BUDGET",
      capacity: 6,
      availableBeds: 6,
      price: 90.0,
      description: "Affordable shared dormitory with 3 bunk beds and personal lockers.",
      amenities: ["Bunk Beds", "Personal Lockers", "Wi-Fi", "Ceiling Fan"],
      images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600"],
    },
  });

  console.log("Seeding bookings and waitlist...");
  // 1. Confirmed bookings in standardRoom to occupy all 4 beds
  const confirmedStudents = [student1, student2, student3, student4];
  for (let i = 0; i < 4; i++) {
    await prisma.booking.create({
      data: {
        userId: confirmedStudents[i].id,
        roomId: standardRoom.id,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        totalAmount: standardRoom.price,
      },
    });
  }

  // 2. Add waitlisted bookings on standardRoom (since beds = 0)
  // Let's create an additional student who will be waitlisted
  const student5 = await prisma.user.create({
    data: {
      fullName: "Evan Waitlist",
      email: "student5@unistay.com",
      password: hashedStudentPassword,
      role: "STUDENT",
    },
  });

  const student6 = await prisma.user.create({
    data: {
      fullName: "Fiona Waitlist",
      email: "student6@unistay.com",
      password: hashedStudentPassword,
      role: "STUDENT",
    },
  });

  await prisma.booking.create({
    data: {
      userId: student5.id,
      roomId: standardRoom.id,
      status: "WAITLISTED",
      paymentStatus: "PAID",
      totalAmount: standardRoom.price,
      queuePosition: 1,
    },
  });

  await prisma.booking.create({
    data: {
      userId: student6.id,
      roomId: standardRoom.id,
      status: "WAITLISTED",
      paymentStatus: "PAID",
      totalAmount: standardRoom.price,
      queuePosition: 2,
    },
  });

  // 3. Create a pending booking for Alice in VIP room
  const alicePendingVip = await prisma.booking.create({
    data: {
      userId: student1.id,
      roomId: vipRoom.id,
      status: "PENDING",
      paymentStatus: "PENDING",
      totalAmount: vipRoom.price,
    },
  });

  console.log("Seeding system settings...");
  await prisma.systemSetting.createMany({
    data: [
      { key: "application_deadline", value: "2026-08-31T23:59:59.000Z" },
      { key: "waiting_list_max_size", value: "50" },
      { key: "auto_promotion_enabled", value: "true" },
    ],
  });

  console.log("Seeding announcements...");
  await prisma.announcement.create({
    data: {
      title: "Hostel Allocation Guidelines 2026",
      content: "Please complete your applications and submit payments before the August 31st deadline to guarantee your booking or waitlist priority.",
      targetRole: "STUDENT",
      authorId: admin.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Host Room Verification Protocol",
      content: "Ensure all rooms have high-resolution images showing structural layouts and bunk bed details before sending for approval.",
      targetRole: "HOST",
      authorId: admin.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
