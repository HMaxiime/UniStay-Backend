import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

if (typeof PrismaClient === "undefined") {
  throw new Error("Prisma Client is not generated. Run `prisma generate` before starting the server.");
}
const dbUrl = process.env["DATABASE_URL"] ?? "";
let dbHost = "";
try {
  dbHost = new URL(dbUrl).hostname;
} catch {
}
const isLocalDb = dbHost === "localhost" || dbHost === "127.0.0.1";
const sslConfig = isLocalDb ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,

  ssl: sslConfig,
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
