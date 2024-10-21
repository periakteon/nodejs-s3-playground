import { DateTime } from "luxon";
export interface IFileMetadata {
    firstName: string;
    lastName: string;
    filename: string;
    tempS3Key: string;
    mimeType: string;
    size: number;
    uploadedAt: DateTime;
}
