import { JsonController, Post, Body, Res, UploadedFile } from "routing-controllers";
import { Service } from "typedi";
import { REQ_UploadDto } from "@/dtos/upload.dto";
import { Express, Response } from "express";
import { DateTime } from "luxon";
import { logger } from "@/utils/logger";
import { S3Service } from "@/services/s3.service";
import { RabbitMQService } from "@/services/rabbitmq.service";
import { HttpException } from "@/exceptions/HttpException";
import { IFileMetadata } from "@/interfaces/file-metadata.interface";
import { IUploadResponse } from "@/interfaces/upload-response.interface";

@Service()
@JsonController("/upload")
export class UploadController {
    constructor(
        private readonly s3Service: S3Service,
        private readonly rabbitMQService: RabbitMQService
    ) {}

    @Post()
    async uploadFile(
        @Body({
            validate: {
                validationError: {
                    target: false,
                    value: false,
                },
            },
        })
        body: REQ_UploadDto,
        @UploadedFile("photo")
        file: Express.Multer.File,
        @Res()
        response: Response
    ) {
        try {
            if (!file) {
                logger.warn("Upload attempt with no file");
                return response.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            const tempS3Key = await this.s3Service.uploadToTempS3(file);

            const fileMetadata: IFileMetadata = {
                firstName: body.firstName,
                lastName: body.lastName,
                filename: file.originalname,
                tempS3Key: tempS3Key,
                mimeType: file.mimetype,
                size: file.size,
                uploadedAt: DateTime.now(),
            };

            await this.rabbitMQService.sendToQueue(fileMetadata);

            const responseData: IUploadResponse = {
                tempS3Key: tempS3Key,
                filename: file.originalname,
                firstName: body.firstName,
                lastName: body.lastName,
            };

            return response.status(200).json({
                success: true,
                message: "File uploaded and queued for processing",
                data: responseData,
            });
        } catch (error: unknown) {
            logger.error("Error in uploadFile:", error);
            if (error instanceof HttpException) {
                return response.status(error.status).json({
                    success: false,
                    message: error.message,
                });
            }
            return response.status(500).json({
                success: false,
                message: "An unexpected error occurred during file upload",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
