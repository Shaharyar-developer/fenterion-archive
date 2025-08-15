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

export const downloadFromR2 = async (
  bucketName: string,
  objectName: string
): Promise<Buffer> => {
  if (!bucketName || !objectName) {
    throw new Error("Missing required download parameters.");
  }
  try {
    const stream = await r2Client.getObject(bucketName, objectName);
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", (err) => reject(err));
    });
  } catch (error) {
    console.error(
      `Error downloading "${objectName}" from bucket "${bucketName}":`,
      error
    );
    throw new Error("Failed to download from R2.");
  }
};

export const removeFromR2 = async (
  bucketName: string,
  objectNames: string[]
): Promise<void> => {
  if (!bucketName || !objectNames?.length) return;
  for (const objectName of objectNames) {
    try {
      await r2Client.removeObject(bucketName, objectName);
    } catch (error) {
      console.error(
        `Error removing "${objectName}" from bucket "${bucketName}":`,
        error
      );
      // continue with others; best-effort
    }
  }
};

export async function listObjectsWithPrefix(
  bucketName: string,
  prefix: string
): Promise<string[]> {
  return await new Promise((resolve, reject) => {
    const objects: string[] = [];
    const stream = r2Client.listObjectsV2(bucketName, prefix, true);
    stream.on("data", (obj: any) => {
      if (obj?.name) objects.push(obj.name);
    });
    stream.on("error", (err: any) => reject(err));
    stream.on("end", () => resolve(objects));
  });
}

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
