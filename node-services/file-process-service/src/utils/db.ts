import { MongoClient, Db, Collection } from "mongodb";
import { MONGO_CONNECTION_URL } from "@config/env";
import { logger } from "@/utils/logger";

export class MongoDB {
    private static instance: MongoDB;
    private client: MongoClient;
    private db: Db | null = null;

    private constructor() {
        this.client = new MongoClient(MONGO_CONNECTION_URL);
    }

    public static getInstance(): MongoDB {
        if (!MongoDB.instance) {
            MongoDB.instance = new MongoDB();
        }
        return MongoDB.instance;
    }

    public async connect(): Promise<void> {
        try {
            await this.client.connect();
            this.db = this.client.db();
            logger.info("Successfully connected to MongoDB");
        } catch (error: unknown) {
            logger.error("Failed to connect to MongoDB", error);
            throw error;
        }
    }

    public getDb(): Db {
        if (!this.db) {
            throw new Error("Database not connected. Call connect() first.");
        }
        return this.db;
    }

    public getCollection<T>(collectionName: string): Collection<T> {
        if (!this.db) {
            throw new Error("Database not connected. Call connect() first.");
        }
        return this.db.collection<T>(collectionName);
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.db = null;
            logger.info("✅ MongoDB connection closed");
        }
    }

    public isConnected(): boolean {
        return this.db !== null;
    }
}
