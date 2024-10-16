import { Service } from "typedi";
import { UploadRepository } from "@repositories/upload.repository";
import { REQ_UploadDto } from "@dtos/upload.dto";
import { IDBUpload } from "@interfaces/upload.interface";

@Service()
export class UploadService {
    private uploadRepository: UploadRepository;

    constructor() {
        this.uploadRepository = new UploadRepository();
    }

    async saveUpload(uploadData: REQ_UploadDto, filename: string): Promise<IDBUpload> {
        const url = `http://example.com/uploads/${filename}`; // TODO: Replace with S3 URL

        const newUpload = await this.uploadRepository.create({
            firstName: uploadData.firstName,
            lastName: uploadData.lastName,
            filename,
            url,
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
