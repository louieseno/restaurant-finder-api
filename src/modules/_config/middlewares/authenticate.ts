import config from "@config/config";
import { Request, Response, NextFunction } from "express";

export const secretCodeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { code } = req.query;

  if (!code || code !== config.ENDPOINT_SECRET_CODE) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing access code",
    });
    return;
  }

  next();
};
