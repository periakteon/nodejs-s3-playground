import { MongoDB } from "@/utils/db";
import { IDBUpload } from "@/interfaces/upload.interface";
import { Collection, ObjectId } from "mongodb";

export class UploadRepository {
    private collection: Collection<IDBUpload>;

    constructor() {
        this.collection = MongoDB.getInstance().getCollection<IDBUpload>("uploads");
    }

    async create(upload: Omit<IDBUpload, "_id" | "createdAt" | "updatedAt">): Promise<IDBUpload> {
        try {
            const now = new Date();

            const newUpload: IDBUpload = {
                ...upload,
                createdAt: now,
                updatedAt: now,
            };

            const result = await this.collection.insertOne(newUpload);

            return { ...newUpload, _id: result.insertedId };
        } catch (error) {
            console.error("Error in create method:", error);
            throw new Error("Failed to create upload");
        }
    }

    async findById(id: string): Promise<IDBUpload | null> {
        try {
            return await this.collection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            console.error("Error in findById:", error);
            return null;
        }
    }

    async findAll(): Promise<IDBUpload[]> {
        try {
            return await this.collection.find({}).toArray();
        } catch (error) {
            console.error("Error in findAll:", error);
            return [];
        }
    }
}
