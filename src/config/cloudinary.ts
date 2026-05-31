import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
};

const requiredEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is not set`);
  }
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME as string;
const apiKey = process.env.CLOUDINARY_API_KEY as string;
const apiSecret = process.env.CLOUDINARY_API_SECRET as string;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

function normalizeFileName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function toUploadResult(result: UploadApiResponse): CloudinaryUploadResult {
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  originalName = "material"
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
        public_id: normalizeFileName(originalName),
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(toUploadResult(result));
      }
    );

    stream.end(buffer);
  });
}

export async function uploadMaterialToCloudinary(
  file: Express.Multer.File
): Promise<CloudinaryUploadResult> {
  return uploadBufferToCloudinary(file.buffer, "unistay/materials", file.originalname);
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/");
    const uploadIndex = pathParts.indexOf("upload");

    if (uploadIndex === -1) return null;

    const publicIdParts = pathParts.slice(uploadIndex + 1);
    if (publicIdParts[0]?.startsWith("v")) publicIdParts.shift();

    const publicId = publicIdParts.join("/").replace(/\.[^/.]+$/, "");
    return publicId || null;
  } catch {
    return null;
  }
}

export default cloudinary;
