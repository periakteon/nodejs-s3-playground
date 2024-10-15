import { MongoClient, Db } from "mongodb";
import { MONGO_CONNECTION_URL } from "@config/env";
import { logger } from "@/utils/logger";

export class MongoDB {
    private static instance: MongoDB;
    private client: MongoClient;
    private db: Db | null = null;

    private constructor() {
        this.client = new MongoClient(MONGO_CONNECTION_URL);
    }

    // singleton instance
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
            logger.info("Connected to MongoDB");
        } catch (error) {
            logger.error("Failed to connect to MongoDB", error);
            throw error;
        }
    }

    // get database instance
    public getDb(): Db {
        if (!this.db) {
            throw new Error("Database not connected. Call connect() first.");
        }
        return this.db;
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.db = null;
            logger.info("Disconnected from MongoDB");
        }
    }
}
