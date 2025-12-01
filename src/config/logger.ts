import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

// Custom log output format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Winston logger instance
export const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    // Console logs (colored)
    new transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),

    // File logs
    new transports.File({
      filename: "logs/app.log",
      level: "info",
    }),

    new transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  ],
});
