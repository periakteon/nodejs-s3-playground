import { Service } from "typedi";
import { MongoDB } from "@/utils/db";
import { IDBUpload } from "@/interfaces/db-upload.interface";
import { Collection, ObjectId, MongoError } from "mongodb";
import { HttpException } from "@/exceptions/HttpException";
import { logger } from "@/utils/logger";
import { IUploadRepository } from "@/interfaces/upload-repository.interface";

@Service()
export class UploadRepository implements IUploadRepository {
    private collection: Collection<IDBUpload>;
    private mongodb: MongoDB;

    constructor() {
        this.mongodb = MongoDB.getInstance();
        this.initializeCollection();
    }

    private async initializeCollection(): Promise<void> {
        if (!this.mongodb.isConnected()) {
            await this.mongodb.connect();
        }
        this.collection = this.mongodb.getCollection<IDBUpload>("masum-dev-s3-rabbitmq");
    }

    async create(upload: Omit<IDBUpload, "_id" | "createdAt" | "updatedAt">): Promise<IDBUpload> {
        try {
            const now = new Date();

            const newUpload: IDBUpload = {
                ...upload,
                createdAt: now,
                updatedAt: now,
                thumbnails: upload.thumbnails,
            };

            const result = await this.collection.insertOne(newUpload);

            if (!result.insertedId) {
                throw new HttpException(500, "Failed to insert upload into database");
            }

            return { ...newUpload, _id: result.insertedId };
        } catch (error: unknown) {
            logger.error("Error in create method:", error);

            if (error instanceof MongoError) {
                switch (error.code) {
                    case 11000:
                        throw new HttpException(409, "Duplicate entry: This upload already exists");
                    default:
                        throw new HttpException(500, `MongoDB error: ${error.message}`);
                }
            }

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(500, "Failed to create upload");
        }
    }

    async findById(id: string): Promise<IDBUpload | null> {
        try {
            return await this.collection.findOne({ _id: new ObjectId(id) });
        } catch (error: unknown) {
            logger.error("Error in findById:", error);

            if (error instanceof MongoError) {
                throw new HttpException(500, `MongoDB error: ${error.message}`);
            }

            if (error instanceof Error) {
                throw new HttpException(400, `Invalid id: ${error.message}`);
            }

            throw new HttpException(500, "Failed to find upload");
        }
    }

    async findAll(): Promise<IDBUpload[]> {
        try {
            return await this.collection.find({}).toArray();
        } catch (error: unknown) {
            logger.error("Error in findAll:", error);

            if (error instanceof MongoError) {
                throw new HttpException(500, `MongoDB error: ${error.message}`);
            }

            throw new HttpException(500, "Failed to find all uploads");
        }
    }
}
