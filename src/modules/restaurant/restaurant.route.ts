import express, { Router } from "express";
import { RestaurantController } from "./restaurant.controller";
import { secretCodeMiddleware } from "@modules/_config/middlewares/authenticate";
import { executeLimiter } from "@modules/_config/middlewares/rateLimit";

export class RestaurantRoute {
  private static instance: RestaurantRoute;
  private restaurantController: RestaurantController;
  private router: Router;

  private constructor() {
    this.router = express.Router();
    this.restaurantController = RestaurantController.getInstance();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      "/execute",
      executeLimiter,
      secretCodeMiddleware,
      this.restaurantController.execute.bind(this.restaurantController)
    );
  }

  private getRouter(): Router {
    return this.router;
  }

  public static getInstanceRouter(): Router {
    if (!RestaurantRoute.instance) {
      RestaurantRoute.instance = new RestaurantRoute();
    }
    return RestaurantRoute.instance.getRouter();
  }
}
