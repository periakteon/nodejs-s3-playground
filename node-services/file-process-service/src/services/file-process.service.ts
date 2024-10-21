import { Service } from "typedi";
import { S3Service } from "@/services/s3.service";
import { UploadService } from "@/services/upload.service";
import { ThumbnailService } from "@/services/thumbnail.service";
import { IFileMetadata } from "@/interfaces/file-metadata.interface";
import { logger } from "@/utils/logger";
import { HttpException } from "@/exceptions/HttpException";
import { getPublicUrl, validateTempS3Key } from "@/utils/s3Utils";

@Service()
export class FileProcessService {
    constructor(
        private readonly s3Service: S3Service,
        private readonly uploadService: UploadService,
        private readonly thumbnailService: ThumbnailService
    ) {}

    async processFile(fileMetadata: IFileMetadata): Promise<void> {
        try {
            validateTempS3Key(fileMetadata.tempS3Key);

            const originalBuffer = await this.s3Service.getFileBuffer(fileMetadata.tempS3Key);
            const publicS3Key = await this.s3Service.moveFileToPublic(fileMetadata.tempS3Key);

            const thumbnailUrls = await this.thumbnailService.generateAndUploadThumbnails(originalBuffer, publicS3Key);

            await this.uploadService.saveUpload({
                ...fileMetadata,
                url: getPublicUrl(publicS3Key),
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
}
