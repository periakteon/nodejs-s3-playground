# NodeJS S3 Playground

This project is a playground for AWS S3 with Node.js.

## Prerequisites

-   Node.js (version 20.x)
-   npm (comes with Node.js)
-   MongoDB (Make sure you have a MongoDB instance running or update the connection string in the `.env` file)

## Getting Started

1. Clone the repository:

    ```
    git clone <repository-url>
    cd nodejs-s3-playground
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Create a `.env.development.local` file in the root directory and add the following environment variables:

    ```
    NODE_ENV=development
    PORT=9001
    MONGO_CONNECTION_URL=<your-mongodb-connection-string>
    ```

4. Run the development server:
    ```
    npm run dev
    ```

The server should now be running on `http://localhost:9001`.

## Building for Production

To build the project for production:

```
npm run build
```

This will create a `dist` folder with the production build of the application.

### Running in Production

To run the production build:

```
npm run start
```

This will start the server with the production build.

## Docker

To run the project using Docker:

1. Build the Docker image:

    ```
    docker build -t nodejs-s3-playground .
    ```

2. Run the Docker container:
    ```
    docker run -p 9001:9001 -e MONGO_CONNECTION_URL=<your-mongodb-connection-string> nodejs-s3-playground
    ```

Replace `<your-mongodb-connection-string>` with your actual MongoDB connection string.

## API Endpoints

-   `GET /health`: Check the health of the application
-   `POST /upload`: Upload a file
-   `GET /upload/all`: Get all uploads
-   `GET /upload/id/:id`: Get a specific upload by ID

For more details on the API endpoints, please refer to the controller files in the `src/controllers` directory.

## Project Structure

-   `src/`: Source code
    -   `config/`: Configuration files
    -   `controllers/`: API controllers
    -   `dtos/`: Data Transfer Objects
    -   `exceptions/`: Custom exceptions
    -   `interfaces/`: TypeScript interfaces
    -   `middlewares/`: Express middlewares
    -   `repositories/`: Data access layer
    -   `services/`: Business logic
    -   `utils/`: Utility functions
-   `dist/`: Compiled JavaScript (generated after build)
-   `uploads/`: Uploaded files (make sure this directory exists and is writable)

## Scripts

-   `npm run dev`: Run the development server
-   `npm run build`: Build the project for production
-   `npm start`: Run the production server
-   `npm run lint`: Run ESLint
-   `npm run format`: Format code using Prettier

## Environment Variables in Production

When running the application in a production environment, you should set the following environment variables:

-   `NODE_ENV`: Set this to `production`
-   `PORT`: The port on which the application will run (default is 9001)
-   `MONGO_CONNECTION_URL`: Your MongoDB connection string
-   `APP_NAME`: The name of your application
-   `HOST`: The host on which the application will run
-   `LOG_DIR`: Directory for logs
-   `LOG_FORMAT`: Format for logs

You can set these variables in your deployment environment or pass them when running the Docker container. For example:

```bash
docker run -p 9001:9001 \
  -e NODE_ENV=production \
  -e MONGO_CONNECTION_URL=your_mongo_url \
  -e APP_NAME=your_app_name \
  -e HOST=localhost \
  -e PORT=9001 \
  -e LOG_DIR=/app/logs \
  -e LOG_FORMAT=dev \
  nodejs-s3-playground
```

Make sure to replace `your_mongo_url` and `your_app_name` with your actual MongoDB connection string and application name.
