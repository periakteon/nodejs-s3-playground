import { NextFunction, Request, Response } from "express";
import { HttpException } from "@exceptions/HttpException";
import { logger } from "@/utils/logger";

export const ErrorMiddleware = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    try {
        const httpException = error instanceof HttpException ? error : new HttpException(500, "Internal Server Error");
        const status = httpException.status;
        const message = httpException.message;

        logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);
        res.status(status).json({ message });
    } catch (err) {
        next(err);
    }
};
