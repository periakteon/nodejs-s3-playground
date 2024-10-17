import { Service } from "typedi";
import {
    S3Client,
    PutObjectCommand,
    PutObjectCommandInput,
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { AWS_S3_BUCKET, AWS_S3_REGION, AWS_S3_ACCESS_KEY, AWS_S3_SECRET_KEY } from "@/config/env";
import { HttpException } from "@/exceptions/HttpException";
import { logger } from "@/utils/logger";
import { Readable } from "stream";
import sharp from "sharp";

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

    async uploadToTempS3(file: Express.Multer.File): Promise<string> {
        const params: PutObjectCommandInput = {
            Bucket: AWS_S3_BUCKET,
            Key: `temp/${new Date().toISOString().split("T")[0]}/${uuidv4()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        try {
            if (!file.buffer || file.buffer.length === 0) {
                throw new Error("File buffer is empty or undefined");
            }

            await this.s3Client.send(new PutObjectCommand(params));
            return params.Key;
        } catch (error: unknown) {
            console.error("Error uploading file to S3:", error);
            throw new HttpException(500, "Error uploading file to S3");
        }
    }

    async moveFileToPublic(tempS3Key: string): Promise<string> {
        const publicS3Key = tempS3Key.replace("temp/", "public/");

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

            // additional checks
            if (ContentType.startsWith("image/")) {
                const stream = Body as Readable;
                const buffer = await this.streamToBuffer(stream);
                const image = sharp(buffer);
                const metadata = await image.metadata();

                // this is a temporary limit, we can change it later
                const maxWidth = 5000;
                const maxHeight = 5000;
                if ((metadata.width && metadata.width > maxWidth) || (metadata.height && metadata.height > maxHeight)) {
                    throw new Error("Image dimensions exceed the maximum allowed");
                }

                // check for image corruption
                await image.stats(); // will throw an error if the image is corrupt
            }
        } catch (error) {
            logger.error("S3 object validation failed:", error);
            throw new HttpException(400, "Invalid file");
        }
    }

    private async streamToBuffer(stream: Readable): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks)));
        });
    }

    getPublicUrl(publicS3Key: string): string {
        return `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com/${publicS3Key}`;
    }
}
