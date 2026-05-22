-- Add PaymentStatus enum (safe: skips if already exists)
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add REJECTED and COMPLETED to BookingStatus (safe: IF NOT EXISTS)
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

-- Job: add description, isRemote, deadline
ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "isRemote"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deadline"    TIMESTAMP(3);

-- Application: add message, resumeUrl, updatedAt + duplicate-apply guard
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "message"   TEXT,
  ADD COLUMN IF NOT EXISTS "resumeUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Unique constraint: one application per student per job
CREATE UNIQUE INDEX IF NOT EXISTS "Application_userId_jobId_key"
  ON "Application"("userId", "jobId");

-- Booking: add payment tracking columns
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "paymentProof"   TEXT,
  ADD COLUMN IF NOT EXISTS "paymentRef"     TEXT,
  ADD COLUMN IF NOT EXISTS "totalAmount"    DOUBLE PRECISION;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

-- MaterialFile table (safe: skips if already exists)
CREATE TABLE IF NOT EXISTS "MaterialFile" (
  "id"           TEXT    NOT NULL,
  "url"          TEXT    NOT NULL,
  "publicId"     TEXT    NOT NULL,
  "materialId"   TEXT    NOT NULL,
  "resourceType" TEXT    NOT NULL,
  "mimeType"     TEXT    NOT NULL,
  "originalName" TEXT,
  "format"       TEXT,
  "bytes"        INTEGER,
  CONSTRAINT "MaterialFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MaterialFile_publicId_key"
  ON "MaterialFile"("publicId");

-- MaterialFile foreign key (safe: skips if already exists)
DO $$ BEGIN
  ALTER TABLE "MaterialFile"
    ADD CONSTRAINT "MaterialFile_materialId_fkey"
    FOREIGN KEY ("materialId") REFERENCES "Material"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
