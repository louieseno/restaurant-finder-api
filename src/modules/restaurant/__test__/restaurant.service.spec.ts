import { RestaurantService } from "../restaurant.service";
import { OpenApiProvider } from "@providers/llm/open_api/openApi.provider";
import { FourSquareApiProvider } from "@providers/four_square/fourSquareApi.provider";
import { OpenApiJsonResponseDTO } from "@providers/llm/open_api/openApi.dto";
import { FSQRestaurantDTO } from "@providers/four_square/fourSquareApi.dto";

// Mock the provider classes
jest.mock("@providers/llm/open_api/openApi.provider");
jest.mock("@providers/four_square/fourSquareApi.provider");

const mockedOpenApiProvider = OpenApiProvider as jest.Mocked<
  typeof OpenApiProvider
>;
const mockedFourSquareApiProvider = FourSquareApiProvider as jest.Mocked<
  typeof FourSquareApiProvider
>;

describe("RestaurantService", () => {
  let restaurantService: RestaurantService;
  let mockOpenApiProviderInstance: jest.Mocked<OpenApiProvider>;
  let mockFourSquareApiProviderInstance: jest.Mocked<FourSquareApiProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOpenApiProviderInstance = {
      convertMessageToJSON: jest.fn(),
    } as unknown as jest.Mocked<OpenApiProvider>;

    mockFourSquareApiProviderInstance = {
      searchRestaurants: jest.fn(),
    } as unknown as jest.Mocked<FourSquareApiProvider>;

    mockedOpenApiProvider.getInstance = jest
      .fn()
      .mockReturnValue(mockOpenApiProviderInstance);
    mockedFourSquareApiProvider.getInstance = jest
      .fn()
      .mockReturnValue(mockFourSquareApiProviderInstance);

    // Reset the singleton instance
    (RestaurantService as any).instance = undefined;
    restaurantService = RestaurantService.getInstance();
  });

  describe("getInstance", () => {
    it("should return the same instance (singleton pattern)", () => {
      const instance1 = RestaurantService.getInstance();
      const instance2 = RestaurantService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should create provider instances", () => {
      expect(mockedOpenApiProvider.getInstance).toHaveBeenCalled();
      expect(mockedFourSquareApiProvider.getInstance).toHaveBeenCalled();
    });
  });

  describe("execute", () => {
    it("should handle OpenApi provider with required parameters only", async () => {
      const mockMessage = "find pizza places near Central Park";

      const mockOpenApiResponse: OpenApiJsonResponseDTO = {
        action: "restaurant_search",
        parameters: {
          query: "pizza",
          near: "Central Park",
          sort: "RELEVANCE",
        },
      };

      const mockRestaurantData: FSQRestaurantDTO[] = [
        {
          fsq_place_id: "12345",
          name: "Tony's Pizza",
          address: "123 Main St, New York, NY 10001",
          cuisine: "Pizza, Italian",
        },
        {
          fsq_place_id: "67890",
          name: "Mario's Pizzeria",
          address: "456 Oak Ave, New York, NY 10002",
          cuisine: "Pizza",
        },
      ];

      mockOpenApiProviderInstance.convertMessageToJSON.mockResolvedValue(
        mockOpenApiResponse
      );
      mockFourSquareApiProviderInstance.searchRestaurants.mockResolvedValue(
        mockRestaurantData
      );

      const result = await restaurantService.execute(mockMessage);

      expect(
        mockOpenApiProviderInstance.convertMessageToJSON
      ).toHaveBeenCalledWith(mockMessage);
      expect(
        mockFourSquareApiProviderInstance.searchRestaurants
      ).toHaveBeenCalledWith(mockOpenApiResponse.parameters);
      expect(result).toEqual({
        response: mockRestaurantData,
      });
    });

    it("should handle OpenApi provider with optional parameters", async () => {
      const mockMessage =
        "Find expensive Italian restaurants open now in Manhattan with 5 star rating";
      const mockOpenApiResponse: OpenApiJsonResponseDTO = {
        action: "restaurant_search",
        parameters: {
          query: "expensive Italian",
          near: "Manhattan",
          min_price: 3,
          max_price: 4,
          open_now: true,
          sort: "RATING",
        },
      };

      const mockRestaurantData: FSQRestaurantDTO[] = [
        {
          fsq_place_id: "italian123",
          name: "Bella Italia",
          address: "789 Park Ave, Manhattan, NY 10021",
          cuisine: "Italian, Fine Dining",
        },
        {
          fsq_place_id: "italian456",
          name: "Trattoria Romano",
          address: "321 5th Ave, Manhattan, NY 10016",
          cuisine: "Italian",
        },
      ];

      mockOpenApiProviderInstance.convertMessageToJSON.mockResolvedValue(
        mockOpenApiResponse
      );
      mockFourSquareApiProviderInstance.searchRestaurants.mockResolvedValue(
        mockRestaurantData
      );

      const result = await restaurantService.execute(mockMessage);

      expect(
        mockOpenApiProviderInstance.convertMessageToJSON
      ).toHaveBeenCalledWith(mockMessage);
      expect(
        mockFourSquareApiProviderInstance.searchRestaurants
      ).toHaveBeenCalledWith(mockOpenApiResponse.parameters);
      expect(result).toEqual({
        response: mockRestaurantData,
      });
    });

    it("should handle OpenApi provider errors", async () => {
      const mockMessage = "find sushi places near me";
      const openApiError = new Error("Failed to parse LLM response as JSON");
      mockOpenApiProviderInstance.convertMessageToJSON.mockRejectedValue(
        openApiError
      );

      await expect(restaurantService.execute(mockMessage)).rejects.toThrow(
        "Failed to parse LLM response as JSON"
      );

      expect(
        mockOpenApiProviderInstance.convertMessageToJSON
      ).toHaveBeenCalledWith(mockMessage);
      expect(
        mockFourSquareApiProviderInstance.searchRestaurants
      ).not.toHaveBeenCalled();
    });

    it("should handle FourSquare API errors", async () => {
      const mockMessage = "find vegan restaurants near Chicago";
      const mockOpenApiResponse: OpenApiJsonResponseDTO = {
        action: "restaurant_search",
        parameters: {
          query: "vegan",
          near: "Chicago",
          sort: "RELEVANCE",
        },
      };

      const fourSquareError = new Error(
        "Foursquare API error: Invalid API key"
      );
      mockOpenApiProviderInstance.convertMessageToJSON.mockResolvedValue(
        mockOpenApiResponse
      );
      mockFourSquareApiProviderInstance.searchRestaurants.mockRejectedValue(
        fourSquareError
      );

      await expect(restaurantService.execute(mockMessage)).rejects.toThrow(
        "Foursquare API error: Invalid API key"
      );
      expect(
        mockOpenApiProviderInstance.convertMessageToJSON
      ).toHaveBeenCalledWith(mockMessage);
      expect(
        mockFourSquareApiProviderInstance.searchRestaurants
      ).toHaveBeenCalledWith(mockOpenApiResponse.parameters);
    });

    it("should handle validation errors from OpenApi", async () => {
      const mockMessage = "find cheap Thai food near me";
      const validationError = new Error(
        "LLM response validation error: Invalid sort parameter"
      );
      mockOpenApiProviderInstance.convertMessageToJSON.mockRejectedValue(
        validationError
      );

      await expect(restaurantService.execute(mockMessage)).rejects.toThrow(
        "LLM response validation error: Invalid sort parameter"
      );

      expect(
        mockOpenApiProviderInstance.convertMessageToJSON
      ).toHaveBeenCalledWith(mockMessage);
      expect(
        mockFourSquareApiProviderInstance.searchRestaurants
      ).not.toHaveBeenCalled();
    });

    it("should handle network errors from FourSquare API", async () => {
      const mockMessage = "find BBQ places in Texas";
      const mockOpenApiResponse: OpenApiJsonResponseDTO = {
        action: "restaurant_search",
        parameters: {
          query: "BBQ",
          near: "Texas",
          sort: "RELEVANCE",
        },
      };
      const networkError = new Error("Network Error");
      mockOpenApiProviderInstance.convertMessageToJSON.mockResolvedValue(
        mockOpenApiResponse
      );
      mockFourSquareApiProviderInstance.searchRestaurants.mockRejectedValue(
        networkError
      );
      await expect(restaurantService.execute(mockMessage)).rejects.toThrow(
        "Network Error"
      );
      expect(
        mockOpenApiProviderInstance.convertMessageToJSON
      ).toHaveBeenCalledWith(mockMessage);
      expect(
        mockFourSquareApiProviderInstance.searchRestaurants
      ).toHaveBeenCalledWith(mockOpenApiResponse.parameters);
    });
  });
});
