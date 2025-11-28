import express from "express";
import config from "@config/config";
import { apiV1 } from "@modules/_config/routes/v1";

// Create the main app
const app = express();

app.use(express.json());

// Mount versioned API
app.use("/api/v1", apiV1);

async function startServer() {
  try {
    // Start listening
    app.listen(config.PORT, () => {
      console.log(
        `Server is running at http://localhost:${config.PORT}/api/v1`
      );
    });
  } catch (err) {
    console.error("🔴 Failed to initialize server:", err);
    process.exit(1);
  }
}

startServer();
