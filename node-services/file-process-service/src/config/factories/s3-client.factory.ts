import { S3Client } from "@aws-sdk/client-s3";
import { AWS_S3_REGION, AWS_S3_ACCESS_KEY, AWS_S3_SECRET_KEY } from "@/config/env";

export function createS3Client(): S3Client {
    return new S3Client({
        region: AWS_S3_REGION,
        credentials: {
            accessKeyId: AWS_S3_ACCESS_KEY,
            secretAccessKey: AWS_S3_SECRET_KEY,
        },
    });
}
