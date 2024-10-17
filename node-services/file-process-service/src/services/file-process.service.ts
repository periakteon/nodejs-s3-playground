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
            if (!this.isValidTempS3Key(fileMetadata.tempS3Key)) {
                throw new HttpException(400, "Invalid tempS3Key");
            }

            const publicS3Key = await this.s3Service.moveFileToPublic(fileMetadata.tempS3Key);

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
        // !!! Change if the validation logic changes !!!
        return tempS3Key.startsWith("temp/") && tempS3Key.length > 5;
    }
}
