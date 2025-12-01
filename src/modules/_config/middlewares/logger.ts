import { logger } from "@config/logger";
import { Request, Response, NextFunction } from "express";

export const loggerMiddleware = (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};
