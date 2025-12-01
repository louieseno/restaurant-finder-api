import config from "@config/config";
import { OpenApiJsonParametersDTO } from "@providers/llm/open_api/openApi.dto";
import axios from "axios";
import {
  FSQCategoryDTO,
  FSQPlaceAPIResponseDTO,
  FSQRestaurantDTO,
} from "./fourSquareApi.dto";
import { logger } from "@config/logger";

export class FourSquareApiProvider {
  private static instance: FourSquareApiProvider;

  private constructor() {}

  public static getInstance(): FourSquareApiProvider {
    if (!FourSquareApiProvider.instance) {
      FourSquareApiProvider.instance = new FourSquareApiProvider();
    }
    return FourSquareApiProvider.instance;
  }

  public async searchRestaurants(
    params: OpenApiJsonParametersDTO
  ): Promise<FSQRestaurantDTO[]> {
    try {
      const response = await axios.get(
        `${config.FSQ_PLACES_BASE_URL}/places/search`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${config.FSQ_API_KEY}`,
            "X-Places-Api-Version": "2025-06-17",
          },
          params: {
            ...params,
            limit: 50, // The number of results to return, up to 50. Defaults to 10.
            fields: "fsq_place_id,name,location,categories",
          },
        }
      );
      return response.data.results.map((place: FSQPlaceAPIResponseDTO) => ({
        fsq_place_id: place.fsq_place_id,
        name: place.name,
        address: place.location?.formatted_address || "",
        cuisine: place.categories?.length
          ? place.categories
              .map((cat: FSQCategoryDTO) => cat.short_name)
              .join(", ")
          : "N/A",
      }));
    } catch (error) {
      logger.error("Error in FourSquareApiProvider.searchRestaurants:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Foursquare API error: ${
            error.response?.data?.message || error.message
          }`
        );
      }
      throw error;
    }
  }
}
