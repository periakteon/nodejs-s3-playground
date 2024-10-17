import "reflect-metadata";
import express from "express";
import { useContainer, useExpressServer } from "routing-controllers";
import Container from "typedi";
import morgan from "morgan";
import { NODE_ENV, PORT, LOG_FORMAT, HOST, RABBITMQ_URL } from "@config/env";
import { ErrorMiddleware } from "@/middlewares/error.middleware";
import { logger, stream } from "@/utils/logger";
import helmet from "helmet";
import { RabbitMQService } from "@/services/rabbitmq.service";
import { MongoDB } from "@/utils/db";

export class App {
    public app: express.Application;
    public env: string;
    public host: string;
    public port: string | number;
    private rabbitMQService: RabbitMQService;

    constructor(Controllers: Function[]) {
        // initialize express app
        this.app = express();
        this.env = NODE_ENV ?? "development";
        this.host = HOST ?? "localhost";
        this.port = PORT ?? 9002;
        // initialize container (dependency injection)
        useContainer(Container);
        // initialize rabbitmq service
        this.rabbitMQService = Container.get(RabbitMQService);
        // initialize middlewares
        this.initializeMiddlewares();

        // initialize routes
        this.initializeRoutes(Controllers);

        // initialize error handling
        this.initializeErrorHandling();
    }

    public async listen() {
        await this.initializeMongoDB();
        await this.initializeRabbitMQ();
        this.app.listen(this.port, () => {
            logger.info(`==================================================`);
            logger.info(`=============== ENV: ${this.env} =================`);
            logger.info(`🚀 File Process Service is running at ${this.host}:${this.port} 🚀`);
            logger.info(`==================================================`);
        });
    }

    public getServer() {
        return this.app;
    }

    private async initializeMongoDB() {
        try {
            await MongoDB.getInstance().connect();
        } catch (error: unknown) {
            logger.error("Failed to connect to MongoDB", error);
            process.exit(1);
        }
    }

    private async initializeRabbitMQ() {
        try {
            await this.rabbitMQService.initialize();
        } catch (error) {
            logger.error("Failed to initialize RabbitMQ", error);
            process.exit(1);
        }
    }

    public async closeConnections() {
        await this.rabbitMQService.close();
        await MongoDB.getInstance().disconnect();
        logger.info("Closed all connections");
    }

    private initializeMiddlewares() {
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

    private initializeErrorHandling() {
        this.app.use(ErrorMiddleware);
    }
}
