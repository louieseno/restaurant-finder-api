import express from "express";
import config from "@config/config";
import { apiV1 } from "@modules/_config/routes/v1";
import { loggerMiddleware } from "@modules/_config/middlewares/logger";
import { logger } from "@config/logger";

// Create the main app
const app = express();

app.use(express.json());
app.use(loggerMiddleware);

// Mount versioned API
app.use("/api/v1", apiV1);

async function startServer() {
  const server = app.listen(config.PORT, () => {
    logger.info(`Server is running at http://localhost:${config.PORT}/api/v1`);
  });

  server.on("error", (err) => {
    logger.error("Failed to initialize server:", err);
    process.exit(1);
  });
}

startServer();
