import { JsonController, Post, Body, Res, UploadedFile, Get, Param } from "routing-controllers";
import { Service } from "typedi";
import { REQ_UploadDto } from "@/dtos/upload.dto";
import { Response } from "express";
import { logger } from "@/utils/logger";
import { S3Service } from "@/services/s3.service";
import { RabbitMQService } from "@/services/rabbitmq.service";
import { HttpException } from "@/exceptions/HttpException";
import { Express } from "express";
import { IFileMetadata } from "@/interfaces/file-metadata.interface";
import { IUploadResponse } from "@/interfaces/upload-response.interface";

@Service()
@JsonController("/upload")
export class UploadController {
    constructor(
        private s3Service: S3Service,
        private rabbitMQService: RabbitMQService
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
                uploadedAt: new Date(),
            };

            await this.rabbitMQService.sendToQueue(fileMetadata);

            logger.info(`File uploaded to temp S3 and queued for processing: ${tempS3Key}`);

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
        } catch (error) {
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
                error: error.message || "Unknown error",
            });
        }
    }

    // @Get("/all")
    // async getAllUploads(@Res() response: Response) {
    //     try {
    //         const uploads = await this.uploadService.getAllUploads();
    //         return response.status(200).json({
    //             success: true,
    //             data: uploads,
    //         });
    //     } catch (error) {
    //         logger.error("Failed to retrieve all uploads", error);
    //         return response.status(500).json({
    //             success: false,
    //             message: "Failed to retrieve all uploads",
    //             error: error.message,
    //         });
    //     }
    // }

    // @Get("/id/:id")
    // async getUpload(@Param("id") id: string, @Res() response: Response) {
    //     try {
    //         const upload = await this.uploadService.getUploadById(id);

    //         if (!upload) {
    //             return response.status(404).json({
    //                 success: false,
    //                 message: "Upload not found",
    //             });
    //         }

    //         return response.status(200).json({
    //             success: true,
    //             data: upload,
    //         });
    //     } catch (error) {
    //         logger.error(`Failed to retrieve upload with id ${id}`, error);
    //         return response.status(500).json({
    //             success: false,
    //             message: "Failed to retrieve upload",
    //             error: error.message,
    //         });
    //     }
    // }
}
