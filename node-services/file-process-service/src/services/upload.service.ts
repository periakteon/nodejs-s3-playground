import { Service } from "typedi";
import { IUploadRepository } from "@/interfaces/upload-repository.interface";
import { UploadRepository } from "@repositories/upload.repository";
import { IDBUpload } from "@interfaces/db-upload.interface";
import { IFileMetadata } from "@/interfaces/file-metadata.interface";

@Service()
export class UploadService {
    private uploadRepository: IUploadRepository;

    constructor() {
        this.uploadRepository = new UploadRepository();
    }

    async saveUpload(fileMetadata: IFileMetadata & { url: string }): Promise<IDBUpload> {
        const newUpload = await this.uploadRepository.create({
            firstName: fileMetadata.firstName,
            lastName: fileMetadata.lastName,
            filename: fileMetadata.filename,
            url: fileMetadata.url,
            mimeType: fileMetadata.mimeType,
            size: fileMetadata.size,
            uploadedAt: fileMetadata.uploadedAt,
            thumbnails: fileMetadata.thumbnails,
        });
        return newUpload;
    }

    async getUploadById(id: string): Promise<IDBUpload | null> {
        return this.uploadRepository.findById(id);
    }

    async getAllUploads(): Promise<IDBUpload[]> {
        return this.uploadRepository.findAll();
    }
}
