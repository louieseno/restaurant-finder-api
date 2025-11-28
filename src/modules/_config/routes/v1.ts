import { RESTAURANT_ROUTE } from "@modules/restaurant/restaurant.route.js";
import { Router } from "express";

export const apiV1 = Router();

apiV1.use(RESTAURANT_ROUTE);
