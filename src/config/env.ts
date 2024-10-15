import { config } from "dotenv";
import { z } from "zod";
config({ path: `.env.${process.env.NODE_ENV ?? "development"}.local` });

const environmentSchema = z.object({
    // Server configuration
    APP_NAME: z.string().default("s3-file-service-dev-masum"),
    HOST: z.string().default("localhost"),
    PORT: z.coerce.number().default(9001),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Database configuration
    // MONGO_CONNECTION_URL: z
    //     .string()
    //     .default(
    //         "mongodb+srv://acc-dev:CookieTheSupercat@acc-svc-dev.htnprwp.mongodb.net/account-service?retryWrites=true&w=majority&appName=acc-svc-dev"
    //     ),

    // CORS configuration
    // CORS_ORIGIN: z.string().default("*"),
    // CORS_CREDENTIALS: z.coerce.boolean().default(true),

    // AWS S3 configuration
    // AWS_S3_BUCKET: z.string(),
    // AWS_S3_REGION: z.string(),
    // AWS_S3_ACCESS_KEY: z.string(),
    // AWS_S3_SECRET_KEY: z.string(),

    // Logging configuration
    LOG_DIR: z.string().default("../logs"),
    LOG_FORMAT: z.string().default("dev"),
});

function validateEnvironment() {
    try {
        return environmentSchema.parse(process.env);
    } catch (err) {
        if (err instanceof z.ZodError) {
            const { fieldErrors } = err.flatten();
            const errorMessage = Object.entries(fieldErrors)
                .map(([field, errors]) => (errors ? `${field}: ${errors.join(", ")}` : field))
                .join("\n  ");
            console.error(`Missing or invalid environment variables:\n  ${errorMessage}`);
        } else {
            console.error("An unknown error occurred while validating environment variables");
        }
        process.exit(1);
    }
}

const env = validateEnvironment();

export const {
    APP_NAME,
    HOST,
    PORT,
    NODE_ENV,
    // MONGO_CONNECTION_URL,
    // AWS_S3_BUCKET,
    // AWS_S3_REGION,
    // AWS_S3_ACCESS_KEY,
    // AWS_S3_SECRET_KEY,
    LOG_DIR,
    LOG_FORMAT,
    // CORS_ORIGIN,
    // CORS_CREDENTIALS,
} = env;
