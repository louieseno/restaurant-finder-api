import dotenv from "dotenv";

dotenv.config();

interface Config {
  PORT: number;
  NODE_ENV: string;
  ENDPOINT_SECRET_CODE: string;
  FSQ_PLACES_BASE_URL: string;
  FSQ_API_KEY: string;
  OPEN_API_KEY: string;
}

const config: Config = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  ENDPOINT_SECRET_CODE: process.env.ENDPOINT_SECRET_CODE || "",
  FSQ_PLACES_BASE_URL: process.env.FSQ_PLACES_BASE_URL || "",
  FSQ_API_KEY: process.env.FSQ_API_KEY || "",
  OPEN_API_KEY: process.env.OPEN_API_KEY || "",
};

export default config;
