# Node Services

The project consists of two main Node.js services: `file-service` and `file-process-service`. These services work together to handle file uploads, storage, and processing.

## File Service

The `file-service` is responsible for handling initial file uploads and queueing them for processing.

### Key Components:

1. **App Configuration (`app.ts`):**

   - Sets up the Express application
   - Initializes middleware
   - Configures routes
   - Handles error middleware

2. **Upload Controller (`upload.controller.ts`):**

   - Handles file upload requests
   - Interacts with S3 service for temporary storage
   - Queues file metadata for processing using RabbitMQ

3. **S3 Service (`s3.service.ts`):**

   - Manages interactions with AWS S3
   - Handles temporary file uploads to S3

4. **RabbitMQ Service (`rabbitmq.service.ts`):**

   - Manages connection to RabbitMQ
   - Sends file metadata to processing queue

5. **Environment Configuration (`env.ts`):**

   - Manages environment variables
   - Uses Zod for validation

6. **Multer Configuration (`multer.config.ts`):**
   - Configures file upload middleware
   - Sets file size limits and allowed file types

## File Process Service

The `file-process-service` is responsible for processing uploaded files and storing their metadata.

### Key Components:

1. **App Configuration (`app.ts`):**

   - Similar to file-service, but also initializes MongoDB connection

2. **File Process Service (`file-process.service.ts`):**

   - Processes files received from the queue
   - Moves files from temporary to public S3 storage
   - Saves file metadata to the database

3. **S3 Service (`s3.service.ts`):**

   - Similar to file-service, but with additional methods for moving files within S3

4. **Upload Service (`upload.service.ts`):**

   - Manages saving and retrieving file metadata from the database

5. **Upload Repository (`upload.repository.ts`):**

   - Handles database operations for file metadata

6. **MongoDB Utility (`db.ts`):**

   - Manages MongoDB connection and provides database access methods

7. **RabbitMQ Service (`rabbitmq.service.ts`):**
   - Consumes messages from the processing queue

## Shared Components

Both services share similar configurations and utilities:

- Error handling middleware
- Logging utility
- Environment configuration
- TypeScript configurations
- ESLint and Prettier setups

## Architecture Overview

1. The `file-service` receives file uploads, stores them temporarily in S3, and queues metadata for processing.
2. The `file-process-service` consumes queued metadata, processes the files, moves them to permanent storage, and saves metadata to MongoDB.
3. Both services use RabbitMQ for inter-service communication.
4. AWS S3 is used for file storage (both temporary and permanent).
5. MongoDB is used for storing file metadata.

This architecture allows for scalable and distributed file processing, separating the concerns of file reception and file processing.
