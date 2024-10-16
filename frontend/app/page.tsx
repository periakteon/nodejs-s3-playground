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

export default function Page() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    setIsUploading(true);
    const formData = {
      ...values,
      file: acceptedFiles[0],
    };

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(formData);
    setIsUploading(false);
    toast.success("Upload successful");
  }

  // Clean up the preview URL when component unmounts
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
              {acceptedFiles.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p className="truncate">File: {acceptedFiles[0].name}</p>
                  <p>Size: {acceptedFiles[0].size} bytes</p>
                </div>
              )}
              <Button
                disabled={isUploading || acceptedFiles.length === 0}
                type="submit"
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Submit"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
