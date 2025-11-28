import express, { Router } from "express";

class RestaurantRoute {
  private static instance: RestaurantRoute;
  private router: Router;

  private constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/restaurants", (_, res) => {
      res.json({ message: "Restaurants endpoint", data: [] });
    });
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

export const RESTAURANT_ROUTE = RestaurantRoute.getInstanceRouter();
