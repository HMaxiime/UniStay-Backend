import { PrismaPg } from "@prisma/adapter-pg";
import * as PrismaClientModule from "@prisma/client";
import pg from "pg";

const { Pool } = pg;
const { PrismaClient } = PrismaClientModule;

if (!PrismaClient) {
  throw new Error("Prisma Client is not generated. Run `prisma generate` before starting the server.");
}

const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    maxWait: 10000,
    timeout: 15000,
  },
});

export async function connectDB() {
  await prisma.$connect();
  console.log("Database connected successfully");
}

export default prisma;
