import { Service } from "typedi";
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { AWS_S3_BUCKET, AWS_S3_REGION, AWS_S3_ACCESS_KEY, AWS_S3_SECRET_KEY } from "@/config/env";
import { HttpException } from "@/exceptions/HttpException";

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

    async uploadToS3(file: Express.Multer.File): Promise<string> {
        const params: PutObjectCommandInput = {
            Bucket: AWS_S3_BUCKET,
            Key: `uploads/${new Date().toLocaleDateString("tr-TR")}/${uuidv4()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            // I think it's not necessary because it works without it?
            // ACL: "public-read",
        };

        try {
            // Check if file.buffer exists and has content
            if (!file.buffer || file.buffer.length === 0) {
                throw new Error("File buffer is empty or undefined");
            }

            await this.s3Client.send(new PutObjectCommand(params));
            return `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com/${params.Key}`;
        } catch (error) {
            console.error("Error uploading file to S3:", error);
            throw new HttpException(500, "Error uploading file to S3");
        }
    }
}
