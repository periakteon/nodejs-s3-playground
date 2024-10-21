import { Service } from "typedi";
import sharp from "sharp";
import { S3Service } from "@/services/s3.service";
import { getPublicUrl } from "@/utils/s3Utils";

@Service()
export class ThumbnailService {
    constructor(private s3Service: S3Service) {}

    async generateAndUploadThumbnails(originalBuffer: Buffer, publicS3Key: string): Promise<{ [key: string]: string }> {
        const thumbnails = await this.generateThumbnails(originalBuffer);
        return this.uploadThumbnails(thumbnails, publicS3Key);
    }

    private async generateThumbnails(buffer: Buffer): Promise<{ [key: string]: Buffer }> {
        const THUMBNAIL_SIZES = [100, 200, 300, 400, 500];
        const thumbnails: { [key: string]: Buffer } = {};

        for (const size of THUMBNAIL_SIZES) {
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
            const thumbnailKey = await this.s3Service.uploadThumbnail(originalKey, size, buffer);
            thumbnailUrls[size] = getPublicUrl(thumbnailKey);
        }

        return thumbnailUrls;
    }
}
