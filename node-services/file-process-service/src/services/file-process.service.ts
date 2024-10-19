import { Service } from "typedi";
import { S3Service } from "./s3.service";
import { UploadService } from "./upload.service";
import { IFileMetadata } from "@/interfaces/file-metadata.interface";
import { logger } from "@/utils/logger";
import { HttpException } from "@/exceptions/HttpException";
import sharp from "sharp";

@Service()
export class FileProcessService {
    constructor(
        private s3Service: S3Service,
        private uploadService: UploadService
    ) {}

    async processFile(fileMetadata: IFileMetadata): Promise<void> {
        try {
            if (!this.isValidTempS3Key(fileMetadata.tempS3Key)) {
                throw new HttpException(400, "Invalid tempS3Key");
            }

            const originalBuffer = await this.s3Service.getFileBuffer(fileMetadata.tempS3Key);
            const publicS3Key = await this.s3Service.moveFileToPublic(fileMetadata.tempS3Key);

            const thumbnails = await this.generateThumbnails(originalBuffer);
            const thumbnailUrls = await this.uploadThumbnails(thumbnails, publicS3Key);

            await this.uploadService.saveUpload({
                ...fileMetadata,
                url: this.s3Service.getPublicUrl(publicS3Key),
                thumbnails: thumbnailUrls,
            });

            logger.info(`File processed successfully: ${publicS3Key}`);
        } catch (error: unknown) {
            if (error instanceof HttpException) {
                logger.error(`HTTP error: ${error.message}`);
            } else {
                logger.error("Error processing file:", error);
            }
            throw error;
        }
    }

    private async generateThumbnails(buffer: Buffer): Promise<{ [key: string]: Buffer }> {
        const sizes = [100, 200, 300, 400, 500];
        const thumbnails: { [key: string]: Buffer } = {};

        for (const size of sizes) {
            thumbnails[`${size}x${size}`] = await sharp(buffer).resize(size, size, { fit: "cover" }).toBuffer();
        }

        return thumbnails;
    }

    private async uploadThumbnails(
        thumbnails: { [key: string]: Buffer },
        originalKey: string
    ): Promise<{ [key: string]: string }> {
        const thumbnailUrls: { [key: string]: string } = {};

        for (const [size, buffer] of Object.entries(thumbnails)) {
            const thumbnailKey = `${originalKey.replace("public/", "public/thumbnails/")}/${size}`;
            await this.s3Service.uploadThumbnail(thumbnailKey, buffer);
            thumbnailUrls[size] = this.s3Service.getPublicUrl(thumbnailKey);
        }

        return thumbnailUrls;
    }

    private isValidTempS3Key(tempS3Key: string): boolean {
        return tempS3Key.startsWith("temp/") && tempS3Key.length > 5;
    }
}
