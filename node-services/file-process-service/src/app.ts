import "reflect-metadata";
import express from "express";
import { useContainer, useExpressServer } from "routing-controllers";
import Container from "typedi";
import morgan from "morgan";
import { NODE_ENV, PORT, LOG_FORMAT, HOST, RABBITMQ_URL, MONGO_CONNECTION_URL } from "@config/env";
import { ErrorMiddleware } from "@/middlewares/error.middleware";
import { logger, stream } from "@/utils/logger";
import helmet from "helmet";
import { RabbitMQService } from "@/services/rabbitmq.service";
import { MongoDB } from "@/utils/db";
import { Settings } from "luxon";
import { S3Client } from "@aws-sdk/client-s3";
import { createS3Client } from "./config/factories/s3-client.factory";

export class App {
    public app: express.Application;
    public env: string;
    public host: string;
    public port: string | number;
    private mongodb: MongoDB;
    private rabbitMQService: RabbitMQService;

    constructor(Controllers: Function[]) {
        this.app = express();

        this.env = NODE_ENV ?? "development";
        this.host = HOST ?? "localhost";
        this.port = PORT ?? 9002;

        Settings.defaultZone = "utc";

        this.mongodb = MongoDB.getInstance();

        useContainer(Container);
        Container.set(S3Client, createS3Client());

        this.rabbitMQService = Container.get(RabbitMQService);

        this.initializeMiddlewares();
        this.initializeRoutes(Controllers);
        this.initializeErrorHandling();
    }

    public async listen(): Promise<void> {
        await this.initializeMongoDB();
        await this.initializeRabbitMQ();
        this.startServer();
    }

    public getServer(): express.Application {
        return this.app;
    }

    private async initializeMongoDB(): Promise<void> {
        try {
            await this.mongodb.connect();
        } catch (error: unknown) {
            logger.error("Failed to connect to MongoDB", error);
            process.exit(1);
        }
    }

    private startServer(): void {
        this.app.listen(this.port, () => {
            logger.info(`==================================================`);
            logger.info(`=============== ENV: ${this.env} =================`);
            logger.info(`🚀 App is up and running at ${this.host}:${this.port} 🚀`);
            logger.info(`==================================================`);
            logger.info(`✅ MongoDB connection initialized successfully`);
            logger.info(`🧬 MongoDB URL: ${MONGO_CONNECTION_URL}`);
            logger.info(`==================================================`);
            logger.info(`✅ RabbitMQ connection initialized successfully`);
            logger.info(`🐇 RabbitMQ URL: ${RABBITMQ_URL}`);
            logger.info(`RabbitMQ UI: http://localhost:15672`);
            logger.info(`==================================================`);
        });
    }

    private async initializeRabbitMQ(): Promise<void> {
        try {
            await this.rabbitMQService.initialize();
        } catch (error: unknown) {
            logger.error("Failed to initialize RabbitMQ", error);
            process.exit(1);
        }
    }

    public async closeConnections(): Promise<void> {
        await this.rabbitMQService.close();
        await this.mongodb.disconnect();
    }

    private initializeMiddlewares(): void {
        this.app.use(morgan(LOG_FORMAT, { stream }));
        this.app.use(helmet());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
    }

    private initializeRoutes(controllers: Function[]) {
        useExpressServer(this.app, {
            controllers,
            defaultErrorHandler: false,
            cors: true,
            classTransformer: true,
            validation: true,
        });
    }

    private initializeErrorHandling(): void {
        this.app.use(ErrorMiddleware);
    }
}
