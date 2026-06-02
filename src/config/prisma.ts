import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

if (!PrismaClient) {
  throw new Error("Prisma Client is not generated. Run `prisma generate` before starting the server.");
}

// Determine SSL from the DATABASE_URL host, not NODE_ENV.
// Remote databases (Prisma Data Platform, Supabase, Neon, RDS, etc.) require SSL
// even in development. Only disable SSL for local Postgres instances.
const dbUrl = process.env["DATABASE_URL"] ?? "";
let dbHost = "";
try {
  dbHost = new URL(dbUrl).hostname;
} catch {
  // Malformed URL — will fail at connection time with a clearer error
}
const isLocalDb = dbHost === "localhost" || dbHost === "127.0.0.1";
const sslConfig = isLocalDb ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  // Always enable SSL for remote hosts to avoid the pg v8 SECURITY WARNING
  // and to satisfy the SSL requirement of cloud databases.
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
