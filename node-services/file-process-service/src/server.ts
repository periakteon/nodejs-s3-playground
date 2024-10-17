import { App } from "./app";
import { Controllers } from "@/controllers";
import { logger } from "@/utils/logger";

const app = new App(Controllers);

app.listen().catch((error) => {
    logger.error("Failed to start the server", error);
    process.exit(1);
});

process.on("SIGINT", async () => {
    await app.closeConnections();
    process.exit(0);
});
