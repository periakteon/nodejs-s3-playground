import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface UploadData {
  firstName: string;
  lastName: string;
  photo: File;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    filename: string;
    url: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    updatedAt: string;
  };
}

async function uploadFile(data: UploadData): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("firstName", data.firstName);
  formData.append("lastName", data.lastName);
  formData.append("photo", data.photo);

  try {
    const response = await axios.post<UploadResponse>(
      "http://localhost:9001/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Upload failed: ${error.response?.data?.message || error.message}`
      );
    }
    throw new Error("An unexpected error occurred during upload");
  }
}

export const useUploadMutation = () => {
  return useMutation<UploadResponse, Error, UploadData>({
    mutationFn: uploadFile,
  });
};
