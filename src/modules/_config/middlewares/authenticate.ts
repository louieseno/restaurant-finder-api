import config from "@config/config";
import { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";

export const secretCodeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { code } = req.query;
  const errorResponse = {
    error: "Unauthorized",
    message: "Invalid or missing access code",
  };
  if (!code || typeof code !== "string") {
    res.status(401).json(errorResponse);
    return;
  }

  // Use constant-time comparison to prevent timing attacks
  const providedCode = Buffer.from(code, "utf8");
  const expectedCode = Buffer.from(config.ENDPOINT_SECRET_CODE, "utf8");

  // Ensure both buffers are the same length to avoid timing attacks
  if (providedCode.length !== expectedCode.length) {
    res.status(401).json(errorResponse);
    return;
  }

  if (!timingSafeEqual(providedCode, expectedCode)) {
    res.status(401).json(errorResponse);
    return;
  }

  next();
};
