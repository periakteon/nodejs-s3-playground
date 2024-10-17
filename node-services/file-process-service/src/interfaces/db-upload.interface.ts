import { ObjectId } from "mongodb";

export interface IDBUpload {
    _id?: ObjectId;
    firstName: string;
    lastName: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
