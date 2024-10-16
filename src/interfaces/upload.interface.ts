import { ObjectId } from "mongodb";

export interface IDBUpload {
    _id?: ObjectId;
    firstName: string;
    lastName: string;
    filename: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
}
