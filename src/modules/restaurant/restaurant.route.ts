import express, { Router } from "express";
import { RestaurantController } from "./restaurant.controller";

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
    this.router.get("/execute", (req, res) =>
      this.restaurantController.execute(req, res)
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
