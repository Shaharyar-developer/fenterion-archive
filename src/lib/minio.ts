import { Client } from "minio";
import { env } from "./env";

export const r2Client = new Client({
  endPoint: env.R2_ENDPOINT,
  accessKey: env.R2_ACCESS!,
  secretKey: env.R2_SECRET!,
  useSSL: true,
  region: "auto",
});

export const uploadToR2 = async (
  bucketName: string,
  objectName: string,
  file: Buffer,
  contentType: string
): Promise<unknown> => {
  if (!bucketName || !objectName || !file || !contentType) {
    throw new Error("Missing required upload parameters.");
  }
  try {
    return await r2Client.putObject(bucketName, objectName, file, file.length, {
      "Content-Type": contentType,
    });
  } catch (error) {
    console.error(
      `Error uploading "${objectName}" to bucket "${bucketName}":`,
      error
    );
    throw new Error("Failed to upload to R2.");
  }
};

export const generatePresignedPutUrl = async (
  bucketName: string,
  objectName: string,
  expiresIn: number = 3600
): Promise<string> => {
  if (!bucketName || !objectName) {
    throw new Error("Missing required parameters for presigned URL.");
  }
  try {
    return await r2Client.presignedPutObject(bucketName, objectName, expiresIn);
  } catch (error) {
    console.error(
      `Error generating presigned URL for "${objectName}" in bucket "${bucketName}":`,
      error
    );
    throw new Error("Failed to generate presigned URL.");
  }
};

export const testConnection = async (): Promise<void> => {
  try {
    await r2Client.listBuckets();
    console.log("R2 connection successful.");
  } catch (error) {
    console.error("Failed to connect to R2:", error);
    throw new Error("R2 connection failed.");
  }
};
