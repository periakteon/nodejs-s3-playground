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
            // TODO: Validate. Is image? etc.
            // Copy the object to the new location
            await this.s3Client.send(
                new CopyObjectCommand({
                    Bucket: AWS_S3_BUCKET,
                    CopySource: `${AWS_S3_BUCKET}/${tempS3Key}`,
                    Key: publicS3Key,
                })
            );

            // Delete the original object
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

    getPublicUrl(publicS3Key: string): string {
        return `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com/${publicS3Key}`;
    }
}
