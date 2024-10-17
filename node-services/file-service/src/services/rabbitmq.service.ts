import { Service } from "typedi";
import amqp, { Channel, Connection } from "amqplib";
import { RABBITMQ_URL } from "@/config/env";
import { logger } from "@/utils/logger";
import { IFileMetadata } from "@/interfaces/file-metadata.interface";

@Service()
export class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;

    async initialize() {
        try {
            this.connection = await amqp.connect(RABBITMQ_URL);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue("file_processing", { durable: true });
            logger.info("Connected to RabbitMQ");
        } catch (error: unknown) {
            logger.error("Failed to connect to RabbitMQ", error);
            throw error;
        }
    }

    async sendToQueue(data: IFileMetadata) {
        if (!this.channel) {
            throw new Error("RabbitMQ channel not initialized");
        }
        this.channel.sendToQueue("file_processing", Buffer.from(JSON.stringify(data)), { persistent: true });
    }

    async close() {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
    }
}
