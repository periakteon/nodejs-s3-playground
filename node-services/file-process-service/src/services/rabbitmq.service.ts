import { Service } from "typedi";
import amqp, { Channel, Connection } from "amqplib";
import { RABBITMQ_URL } from "@/config/env";
import { logger } from "@/utils/logger";
import { IFileMetadata } from "@/interfaces/file-metadata.interface";
import { FileProcessService } from "@/services/file-process.service";

@Service()
export class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;

    constructor(private fileProcessService: FileProcessService) {}

    async initialize() {
        try {
            this.connection = await amqp.connect(RABBITMQ_URL);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue("file_processing", { durable: true });
            logger.info("Connected to RabbitMQ");
            this.consumeMessages();
        } catch (error: unknown) {
            logger.error("Failed to connect to RabbitMQ", error);
            throw error;
        }
    }

    private async consumeMessages() {
        if (!this.channel) {
            throw new Error("RabbitMQ channel not initialized");
        }

        this.channel.consume("file_processing", async (msg) => {
            if (msg) {
                try {
                    const fileMetadata: IFileMetadata = JSON.parse(msg.content.toString());
                    await this.fileProcessService.processFile(fileMetadata);
                    this.channel.ack(msg);
                } catch (error: unknown) {
                    logger.error("Error processing message:", error);
                    // !!! Nack (negative acknowledge) the message to requeue it if the message is not acknowledged !!!
                    this.channel.nack(msg, false, true);
                }
            }
        });
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
