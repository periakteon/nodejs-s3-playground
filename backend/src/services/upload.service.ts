import { Service } from "typedi";
import { UploadRepository } from "@repositories/upload.repository";
import { REQ_UploadDto } from "@dtos/upload.dto";
import { IDBUpload } from "@interfaces/upload.interface";
import { S3Service } from "./s3.service";

@Service()
export class UploadService {
    private uploadRepository: UploadRepository;
    private s3Service: S3Service;

    constructor() {
        this.uploadRepository = new UploadRepository();
        this.s3Service = new S3Service();
    }

    async saveUpload(uploadData: REQ_UploadDto, file: Express.Multer.File): Promise<IDBUpload> {
        const url = await this.s3Service.uploadToS3(file);

        const newUpload = await this.uploadRepository.create({
            firstName: uploadData.firstName,
            lastName: uploadData.lastName,
            filename: file.originalname,
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
