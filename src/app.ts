import "reflect-metadata";
import express from "express";
import { useContainer, useExpressServer } from "routing-controllers";
import Container from "typedi";
import morgan from "morgan";
import { NODE_ENV, PORT, LOG_FORMAT } from "@config/env";
import { ErrorMiddleware } from "@/middlewares/error.middleware";
import { logger, stream } from "@/utils/logger";
import helmet from "helmet";
import { MongoDB } from "@/utils/db";

export class App {
    public app: express.Application;
    public env: string;
    public port: string | number;
    private mongodb: MongoDB;

    constructor(Controllers: Function[]) {
        // initialize express app
        this.app = express();
        this.env = NODE_ENV ?? "development";
        this.port = PORT ?? 9001;

        // initialize MongoDB instance
        this.mongodb = MongoDB.getInstance();

        // initialize container (dependency injection)
        useContainer(Container);

        // initialize middlewares
        this.initializeMiddlewares();

        // initialize routes
        this.initializeRoutes(Controllers);

        // initialize error handling
        this.initializeErrorHandling();
    }

    public async listen() {
        await this.connectToDatabase();
        this.app.listen(this.port, () => {
            logger.info(`=================================`);
            logger.info(`======= ENV: ${this.env} =======`);
            logger.info(`🚀 App listening on the port ${this.port}`);
            logger.info(`=================================`);
        });
    }

    public getServer() {
        return this.app;
    }

    private async connectToDatabase() {
        try {
            await this.mongodb.connect();
        } catch (error) {
            logger.error("Failed to connect to MongoDB", error);
            process.exit(1);
        }
    }

    public async closeDatabase() {
        await this.mongodb.disconnect();
        logger.info("Disconnected from MongoDB");
    }

    private initializeMiddlewares() {
        this.app.use(morgan(LOG_FORMAT, { stream }));
        this.app.use(helmet());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeRoutes(controllers: Function[]) {
        useExpressServer(this.app, {
            controllers,
            defaultErrorHandler: false,
            // routePrefix: "/api/v1",
            cors: false,
        });
    }

    private initializeErrorHandling() {
        this.app.use(ErrorMiddleware);
    }
}
