import { FourSquareApiProvider } from "../fourSquareApi.provider";
import { OpenApiJsonParametersDTO } from "@providers/llm/open_api/openApi.dto";
import axios from "axios";
import config from "@config/config";
import { logger } from "@config/logger";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock("@config/config", () => ({
  FSQ_PLACES_BASE_URL: "test-base-url",
  FSQ_API_KEY: "test-api-key",
}));

// Mock the winston logger
jest.mock("@config/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("FourSquareApiProvider", () => {
  let provider: FourSquareApiProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance
    (FourSquareApiProvider as any).instance = undefined;
    provider = FourSquareApiProvider.getInstance();
  });

  describe("getInstance", () => {
    it("should return the same instance", () => {
      const instance1 = FourSquareApiProvider.getInstance();
      const instance2 = FourSquareApiProvider.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("searchRestaurants", () => {
    const mockSearchParams: OpenApiJsonParametersDTO = {
      query: "pizza",
      near: "New York, NY",
      min_price: 1,
      max_price: 3,
      open_now: true,
      sort: "RATING",
    };

    it("should successfully search restaurants", async () => {
      const mockApiResponse = {
        data: {
          results: [
            {
              fsq_place_id: "12345",
              name: "Tony's Pizza",
              location: {
                formatted_address: "123 Main St, New York, NY 10001",
              },
              categories: [
                {
                  short_name: "Pizza",
                  name: "Pizza Place",
                  fsq_category_id: "4bf58dd8d48988d1ca941735",
                  plural_name: "Pizza Places",
                  icon: {
                    prefix:
                      "https://ss3.4sqi.net/img/categories_v2/food/pizza_",
                    suffix: ".png",
                  },
                },
              ],
            },
            {
              fsq_place_id: "67890",
              name: "Mario's Italian",
              location: {
                formatted_address: "456 Oak Ave, New York, NY 10002",
              },
              categories: [
                {
                  short_name: "Italian",
                  name: "Italian Restaurant",
                  fsq_category_id: "4bf58dd8d48988d110941735",
                  plural_name: "Italian Restaurants",
                  icon: {
                    prefix:
                      "https://ss3.4sqi.net/img/categories_v2/food/italian_",
                    suffix: ".png",
                  },
                },
                {
                  short_name: "Pizza",
                  name: "Pizza Place",
                  fsq_category_id: "4bf58dd8d48988d1ca941735",
                  plural_name: "Pizza Places",
                  icon: {
                    prefix:
                      "https://ss3.4sqi.net/img/categories_v2/food/pizza_",
                    suffix: ".png",
                  },
                },
              ],
            },
          ],
        },
      };
      mockedAxios.get.mockResolvedValue(mockApiResponse);

      const result = await provider.searchRestaurants(mockSearchParams);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.FSQ_PLACES_BASE_URL}/places/search`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${config.FSQ_API_KEY}`,
            "X-Places-Api-Version": "2025-06-17",
          },
          params: {
            ...mockSearchParams,
            limit: 50,
            fields: "fsq_place_id,name,location,categories",
          },
        }
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        fsq_place_id: "12345",
        name: "Tony's Pizza",
        address: "123 Main St, New York, NY 10001",
        cuisine: "Pizza",
      });
      expect(result[1]).toEqual({
        fsq_place_id: "67890",
        name: "Mario's Italian",
        address: "456 Oak Ave, New York, NY 10002",
        cuisine: "Italian, Pizza",
      });
    });

    it("should handle restaurants with no location", async () => {
      const mockResponseNoLocation = {
        data: {
          results: [
            {
              fsq_place_id: "12345",
              name: "Restaurant Without Address",
              categories: [
                {
                  fsq_category_id: "4bf58dd8d48988d1c4941735",
                  name: "Restaurant",
                  short_name: "Restaurant",
                  plural_name: "Restaurants",
                  icon: {
                    prefix: "https://example_image_",
                    suffix: ".png",
                  },
                },
              ],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponseNoLocation);

      const result = await provider.searchRestaurants(mockSearchParams);

      expect(result[0]).toEqual({
        fsq_place_id: "12345",
        name: "Restaurant Without Address",
        address: "",
        cuisine: "Restaurant",
      });
    });

    it("should handle restaurants with no categories", async () => {
      const mockResponseNoCategories = {
        data: {
          results: [
            {
              fsq_place_id: "12345",
              name: "Restaurant Without Categories",
              location: {
                formatted_address: "123 Unknown St, City, State",
              },
              categories: [],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponseNoCategories);

      const result = await provider.searchRestaurants(mockSearchParams);

      expect(result[0]).toEqual({
        fsq_place_id: "12345",
        name: "Restaurant Without Categories",
        address: "123 Unknown St, City, State",
        cuisine: "N/A",
      });
    });

    it("should handle empty results", async () => {
      const mockEmptyResponse = {
        data: {
          results: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockEmptyResponse);

      const result = await provider.searchRestaurants(mockSearchParams);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should handle axios errors with response data", async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: "Invalid API key",
          },
        },
        message: "Request failed with status code 401",
      };

      mockedAxios.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(
        provider.searchRestaurants(mockSearchParams)
      ).rejects.toThrow("Foursquare API error: Invalid API key");

      expect(logger.error).toHaveBeenCalledWith(
        "Error in FourSquareApiProvider.searchRestaurants:",
        axiosError
      );
    });

    it("should handle axios errors without response data", async () => {
      const axiosError = {
        isAxiosError: true,
        message: "Network Error",
      };

      mockedAxios.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(
        provider.searchRestaurants(mockSearchParams)
      ).rejects.toThrow("Foursquare API error: Network Error");

      expect(logger.error).toHaveBeenCalledWith(
        "Error in FourSquareApiProvider.searchRestaurants:",
        axiosError
      );
    });

    it("should handle non-axios errors", async () => {
      const genericError = new Error("Something went wrong");

      mockedAxios.get.mockRejectedValue(genericError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(
        provider.searchRestaurants(mockSearchParams)
      ).rejects.toThrow("Something went wrong");

      expect(logger.error).toHaveBeenCalledWith(
        "Error in FourSquareApiProvider.searchRestaurants:",
        genericError
      );
    });

    it("should call API with minimal parameters", async () => {
      const minimalParams: OpenApiJsonParametersDTO = {
        query: "sushi",
        near: "Tokyo",
      };

      mockedAxios.get.mockResolvedValue({ data: { results: [] } });

      await provider.searchRestaurants(minimalParams);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.FSQ_PLACES_BASE_URL}/places/search`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${config.FSQ_API_KEY}`,
            "X-Places-Api-Version": "2025-06-17",
          },
          params: {
            query: "sushi",
            near: "Tokyo",
            limit: 50,
            fields: "fsq_place_id,name,location,categories",
          },
        }
      );
    });
  });
});
