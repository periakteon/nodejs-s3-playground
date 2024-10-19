import { Service } from "typedi";
import {
    S3Client,
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { AWS_S3_BUCKET, AWS_S3_REGION, AWS_S3_ACCESS_KEY, AWS_S3_SECRET_KEY } from "@/config/env";
import { HttpException } from "@/exceptions/HttpException";
import { logger } from "@/utils/logger";
import { Readable } from "stream";
import sharp from "sharp";
import { generatePublicS3Key, generateThumbnailKey, streamToBuffer } from "@/utils/s3Utils";

@Service()
export class S3Service {
    private s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            region: AWS_S3_REGION,
            credentials: {
                accessKeyId: AWS_S3_ACCESS_KEY,
                secretAccessKey: AWS_S3_SECRET_KEY,
            },
        });
    }

    async moveFileToPublic(tempS3Key: string): Promise<string> {
        const publicS3Key = generatePublicS3Key(tempS3Key);

        try {
            await this.validateS3Object(tempS3Key);

            await this.s3Client.send(
                new CopyObjectCommand({
                    Bucket: AWS_S3_BUCKET,
                    CopySource: `${AWS_S3_BUCKET}/${tempS3Key}`,
                    Key: publicS3Key,
                })
            );

            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: AWS_S3_BUCKET,
                    Key: tempS3Key,
                })
            );

            return publicS3Key;
        } catch (error: unknown) {
            logger.error("Error moving file in S3:", error);
            throw new HttpException(500, "Error moving file in S3");
        }
    }

    private async validateS3Object(s3Key: string): Promise<void> {
        const getObjectParams = {
            Bucket: AWS_S3_BUCKET,
            Key: s3Key,
        };

        try {
            const { Body, ContentType, ContentLength } = await this.s3Client.send(
                new GetObjectCommand(getObjectParams)
            );

            if (!Body) {
                throw new Error("S3 object not found");
            }

            const maxSize = 10 * 1024 * 1024; // 10MB (for now)
            if (ContentLength && ContentLength > maxSize) {
                throw new Error("File size exceeds the maximum limit");
            }

            const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
            if (!ContentType || !allowedTypes.includes(ContentType)) {
                throw new Error("Invalid file type");
            }

            if (ContentType.startsWith("image/")) {
                const stream = Body as Readable;
                const buffer = await streamToBuffer(stream);
                const image = sharp(buffer);
                const metadata = await image.metadata();

                const maxWidth = 5000;
                const maxHeight = 5000;

                if ((metadata.width && metadata.width > maxWidth) || (metadata.height && metadata.height > maxHeight)) {
                    throw new Error("Image dimensions exceed the maximum allowed");
                }

                await image.stats(); // will throw an error if the image is corrupt
            }
        } catch (error: unknown) {
            logger.error("S3 object validation failed:", error);
            if (error instanceof Error) {
                throw new HttpException(400, error.message);
            }
            throw new HttpException(400, "Invalid file");
        }
    }

    async getFileBuffer(key: string): Promise<Buffer> {
        const { Body } = await this.s3Client.send(new GetObjectCommand({ Bucket: AWS_S3_BUCKET, Key: key }));
        return await streamToBuffer(Body as Readable);
    }

    async uploadThumbnail(originalKey: string, size: string, buffer: Buffer): Promise<string> {
        const thumbnailKey = generateThumbnailKey(originalKey, size);
        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: AWS_S3_BUCKET,
                Key: thumbnailKey,
                Body: buffer,
                ContentType: "image/jpeg",
                ContentLength: buffer.length,
            })
        );
        return thumbnailKey;
    }
}
