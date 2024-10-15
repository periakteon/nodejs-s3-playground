import { JsonController, Post, Body, Res, UseBefore } from "routing-controllers";
import { Service } from "typedi";
import { UploadDto } from "@/dtos/upload.dto";
import { Response } from "express";
import { upload } from "@/config/multer.config";
import { logger } from "@/utils/logger";

@Service()
@JsonController("/upload")
export class UploadController {
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
        body: UploadDto,
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

            logger.info(`File uploaded successfully: ${file.filename}`);

            return response.status(200).json({
                success: true,
                message: "File uploaded successfully",
                data: {
                    filename: file.filename,
                    originalName: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    firstName: body.firstName,
                    lastName: body.lastName,
                },
            });
        } catch (error) {
            logger.error("File upload failed", error);
            return response.status(500).json({
                success: false,
                message: "File upload failed",
                error: error.message,
            });
        }
    }
}
