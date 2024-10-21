import { IDBUpload } from "@/interfaces/db-upload.interface";

export interface IUploadRepository {
    create(upload: Omit<IDBUpload, "_id" | "createdAt" | "updatedAt">): Promise<IDBUpload>;
    findById(id: string): Promise<IDBUpload | null>;
    findAll(): Promise<IDBUpload[]>;
}
