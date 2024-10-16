import { IsString, IsNotEmpty } from "class-validator";

export class REQ_UploadDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    // The 'photo' field is handled by multer middleware
}
