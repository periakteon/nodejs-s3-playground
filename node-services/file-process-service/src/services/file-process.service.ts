import { Service } from "typedi";
import { S3Service } from "./s3.service";
import { UploadService } from "./upload.service";
import { IFileMetadata } from "@/interfaces/file-metadata.interface";
import { logger } from "@/utils/logger";
import { HttpException } from "@/exceptions/HttpException";

@Service()
export class FileProcessService {
    constructor(
        private s3Service: S3Service,
        private uploadService: UploadService
    ) {}

    async processFile(fileMetadata: IFileMetadata): Promise<void> {
        try {
            // Validate the tempS3Key
            if (!this.isValidTempS3Key(fileMetadata.tempS3Key)) {
                throw new HttpException(400, "Invalid tempS3Key");
            }

            // Move file from temp to public folder
            const publicS3Key = await this.s3Service.moveFileToPublic(fileMetadata.tempS3Key);

            // Save metadata to MongoDB
            await this.uploadService.saveUpload({
                ...fileMetadata,
                url: this.s3Service.getPublicUrl(publicS3Key),
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

    private isValidTempS3Key(tempS3Key: string): boolean {
        // Implement your validation logic here
        // For example, check if the key starts with 'temp/' and has a valid format
        return tempS3Key.startsWith("temp/") && tempS3Key.length > 5;
    }
}
