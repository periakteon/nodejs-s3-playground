import { Readable } from "stream";
import { AWS_S3_BUCKET, AWS_S3_REGION } from "@/config/env";
import { HttpException } from "@/exceptions/HttpException";

export function getPublicUrl(publicS3Key: string): string {
    return `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com/${publicS3Key}`;
}

export function generatePublicS3Key(tempS3Key: string): string {
    const parts = tempS3Key.split("/");
    const filename = parts[parts.length - 1];
    const date = parts[parts.length - 2];
    const filenameWithoutExtension = filename.split(".").slice(0, -1).join(".");
    return `public/${date}/${filenameWithoutExtension}/${filename}`;
}

export function generateThumbnailKey(originalKey: string, size: string): string {
    const parts = originalKey.split("/");
    parts.pop();
    return `${parts.join("/")}/thumbnails/${size}`;
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer | Uint8Array) => {
            chunks.push(Buffer.from(chunk));
        });
        stream.on("error", reject);
        stream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
    });
}

export function validateTempS3Key(tempS3Key: string): void {
    if (!tempS3Key.startsWith("temp/") || tempS3Key.length <= 5) {
        throw new HttpException(400, "Invalid tempS3Key");
    }
}
