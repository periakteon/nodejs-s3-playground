"use client";

import { CloudUploadIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { toast } from "sonner";
import { UploadResponse, useUploadMutation } from "~/hooks/useUploadMutation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Separator } from "~/components/ui/separator";

const formSchema = z.object({
  firstName: z
    .string({
      required_error: "First name is required",
    })
    .min(2, {
      message: "First name must be at least 2 characters",
    })
    .max(50, {
      message: "First name must be at most 50 characters",
    }),
  lastName: z
    .string({
      required_error: "Last name is required",
    })
    .min(2, {
      message: "Last name must be at least 2 characters",
    })
    .max(50, {
      message: "Last name must be at most 50 characters",
    }),
});

const queryClient = new QueryClient();

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <UploadForm />
    </QueryClientProvider>
  );
}

function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);

  const { mutate, isPending, isError, error } = useUploadMutation();

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
      }
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (acceptedFiles.length === 0) {
      toast.error("Please select a file to upload");
      return;
    }

    mutate(
      {
        ...values,
        photo: acceptedFiles[0],
      },
      {
        onSuccess: (data) => {
          setUploadedData(data);
          form.reset();
          setPreview(null);
          toast.success("Upload successful");
        },
        onError: (error) => {
          toast.error(`Upload failed: ${error.message}`);
        },
      }
    );
  }

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Fill in your information and upload files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div
                {...getRootProps()}
                className="flex flex-col h-60 items-center justify-center rounded-md border-2 border-dashed border-muted transition-colors hover:border-primary"
              >
                <Input {...getInputProps()} />
                {preview ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={preview}
                      alt="Preview"
                      layout="fill"
                      objectFit="contain"
                      className="rounded-md"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <CloudUploadIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Drag and drop files here or click to select files
                    </p>
                  </div>
                )}
              </div>
              {acceptedFiles.length > 0 && preview && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p className="truncate">File: {acceptedFiles[0].name}</p>
                  <p>Size: {acceptedFiles[0].size} bytes</p>
                </div>
              )}
              <Button
                disabled={isPending || acceptedFiles.length === 0}
                type="submit"
                className="w-full"
              >
                {isPending ? "Uploading..." : "Submit"}
              </Button>
            </form>
          </Form>
          {uploadedData && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="text-lg font-semibold">Upload Result:</h3>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Link:
                    <a
                      href={uploadedData.data.url}
                      className="text-primary underline"
                    >
                      {uploadedData.data.url}
                    </a>
                  </p>
                </div>
                <div className="flex justify-center my-4">
                  <Image
                    src={uploadedData.data.url}
                    className="rounded-md"
                    alt="Uploaded"
                    width={750}
                    height={750}
                  />
                </div>
                <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto">
                  {JSON.stringify(uploadedData, null, 2)}
                </pre>
              </div>
            </>
          )}
          {isError && <div>Error: {error.message}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
