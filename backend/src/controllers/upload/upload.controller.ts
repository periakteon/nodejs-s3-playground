import { JsonController, Post, Get, Body, Param, Res, UploadedFile } from "routing-controllers";
import { Service } from "typedi";
import { REQ_UploadDto } from "@/dtos/upload.dto";
import { Response } from "express";
import { logger } from "@/utils/logger";
import { UploadService } from "@/services/upload.service";
import { HttpException } from "@/exceptions/HttpException";
import { Express } from "express";

@Service()
@JsonController("/upload")
export class UploadController {
    constructor(private uploadService: UploadService) {}

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

            const result = await this.uploadService.saveUpload(body, file);

            logger.info(`File uploaded and saved to S3: ${result.filename}`);

            return response.status(200).json({
                success: true,
                message: "File uploaded and saved successfully",
                data: {
                    _id: result._id,
                    filename: result.filename,
                    url: result.url,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    createdAt: result.createdAt,
                    updatedAt: result.updatedAt,
                },
            });
        } catch (error) {
            logger.error("Error in uploadFile:", error);
            if (error instanceof HttpException) {
                logger.error(`File upload failed: ${error.message}`);
                return response.status(error.status).json({
                    success: false,
                    message: error.message,
                });
            }
            logger.error("Unexpected error during file upload", error);
            return response.status(500).json({
                success: false,
                message: "An unexpected error occurred during file upload",
                error: error.message || "Unknown error",
            });
        }
    }

    @Get("/all")
    async getAllUploads(@Res() response: Response) {
        try {
            const uploads = await this.uploadService.getAllUploads();
            return response.status(200).json({
                success: true,
                data: uploads,
            });
        } catch (error) {
            logger.error("Failed to retrieve all uploads", error);
            return response.status(500).json({
                success: false,
                message: "Failed to retrieve all uploads",
                error: error.message,
            });
        }
    }

    @Get("/id/:id")
    async getUpload(@Param("id") id: string, @Res() response: Response) {
        try {
            const upload = await this.uploadService.getUploadById(id);

            if (!upload) {
                return response.status(404).json({
                    success: false,
                    message: "Upload not found",
                });
            }

            return response.status(200).json({
                success: true,
                data: upload,
            });
        } catch (error) {
            logger.error(`Failed to retrieve upload with id ${id}`, error);
            return response.status(500).json({
                success: false,
                message: "Failed to retrieve upload",
                error: error.message,
            });
        }
    }
}
