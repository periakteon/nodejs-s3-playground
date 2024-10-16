import { Response } from "express";
import { Service } from "typedi";
import { Get, JsonController, Res } from "routing-controllers";
import { APP_NAME } from "@/config/env";
import { UploadController } from "./upload/upload.controller";

@Service()
@JsonController("/health")
class HealthController {
    @Get()
    public getHealth(@Res() response: Response) {
        return response.status(200).send({ ok: true, message: `${APP_NAME} is healthy` });
    }
}

export const Controllers = [HealthController, UploadController];
