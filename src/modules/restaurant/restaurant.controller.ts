import { Request, Response } from "express";
import config from "@config/config";
import { RestaurantService } from "./restaurant.service";

export class RestaurantController {
  private static instance: RestaurantController;
  private restaurantService: RestaurantService;
  private constructor() {
    this.restaurantService = RestaurantService.getInstance();
  }

  public static getInstance(): RestaurantController {
    if (!RestaurantController.instance) {
      RestaurantController.instance = new RestaurantController();
    }
    return RestaurantController.instance;
  }

  /**
   * GET /api/execute?message=<query>&code=<secret_code>
   */
  async execute(req: Request, res: Response): Promise<void> {
    try {
      const { code, message } = req.query;

      if (!code || code !== config.ENDPOINT_SECRET_CODE) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid or missing access code",
        });
        return;
      }

      if (!message || typeof message !== "string") {
        res.status(400).json({
          error: "Bad Request",
          message: "Missing or invalid 'message' parameter",
        });
        return;
      }

      const result = await this.restaurantService.execute(message);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error executing restaurant search:", error);

      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  }
}
