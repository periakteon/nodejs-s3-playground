import { JsonController, Post, Get, Body, Param, Res, UseBefore } from "routing-controllers";
import { Service } from "typedi";
import { REQ_UploadDto } from "@/dtos/upload.dto";
import { Response } from "express";
import { upload } from "@/config/multer.config";
import { logger } from "@/utils/logger";
import { UploadService } from "@/services/upload.service";

@Service()
@JsonController("/upload")
export class UploadController {
    constructor(private uploadService: UploadService) {}

    @Post()
    @UseBefore(upload.single("photo"))
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
        @Res() response: Response
    ) {
        try {
            const { file } = response.req;

            if (!file) {
                return response.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            const result = await this.uploadService.saveUpload(body, file.filename);

            logger.info(`File uploaded and saved to database: ${file.filename}`);

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
            logger.error("File upload and save failed", error);
            return response.status(500).json({
                success: false,
                message: "File upload and save failed",
                error: error.message,
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

    @Get("/:id")
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
