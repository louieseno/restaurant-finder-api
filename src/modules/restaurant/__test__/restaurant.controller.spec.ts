import { Request, Response } from "express";
import { RestaurantController } from "../restaurant.controller";
import { RestaurantService } from "../restaurant.service";
import { logger } from "@config/logger";

// Mock the RestaurantService
jest.mock("../restaurant.service");

// Mock config to avoid environment variable requirements
jest.mock("@config/config", () => ({
  OPEN_API_KEY: "test-openai-key",
  FSQ_API_KEY: "test-fsq-key",
  FSQ_PLACES_BASE_URL: "https://test-fsq-api.com",
  ENDPOINT_SECRET_CODE: "test-secret-code",
  PORT: 3000,
}));

// Mock the winston logger
jest.mock("@config/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockedRestaurantService = RestaurantService as jest.Mocked<
  typeof RestaurantService
>;

describe("RestaurantController", () => {
  let controller: RestaurantController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockRestaurantServiceInstance: jest.Mocked<RestaurantService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRestaurantServiceInstance = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RestaurantService>;

    mockedRestaurantService.getInstance = jest
      .fn()
      .mockReturnValue(mockRestaurantServiceInstance);

    // Reset the singleton instance
    (RestaurantController as any).instance = undefined;
    controller = RestaurantController.getInstance();

    // Set up mock request and response
    mockRequest = {
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("getInstance", () => {
    it("should return the same instance (singleton pattern)", () => {
      const instance1 = RestaurantController.getInstance();
      const instance2 = RestaurantController.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should create provider instances", () => {
      expect(mockedRestaurantService.getInstance).toHaveBeenCalled();
    });
  });

  describe("execute", () => {
    const mockRestaurantData = {
      response: [
        {
          fsq_place_id: "12345",
          name: "Pizza Palace",
          address: "123 Main St, New York, NY",
          cuisine: "Pizza, Italian",
        },
        {
          fsq_place_id: "67890",
          name: "Burger Joint",
          address: "456 Oak Ave, New York, NY",
          cuisine: "American, Burgers",
        },
      ],
    };

    it("should successfully execute restaurant search", async () => {
      mockRequest.query = { message: "find pizza places near me" };
      mockRestaurantServiceInstance.execute.mockResolvedValue(
        mockRestaurantData
      );

      await controller.execute(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRestaurantServiceInstance.execute).toHaveBeenCalledWith(
        "find pizza places near me"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurantData,
      });
    });

    it("should return 400 when message parameter is missing", async () => {
      mockRequest.query = {}; // No message parameter

      await controller.execute(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRestaurantServiceInstance.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Missing or invalid 'message' parameter",
      });
    });

    it("should return 400 when message parameter is empty string", async () => {
      mockRequest.query = { message: "" }; // Empty string

      await controller.execute(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRestaurantServiceInstance.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Missing or invalid 'message' parameter",
      });
    });

    it("should return 400 when message parameter is invalid type", async () => {
      mockRequest.query = { message: ["find pizza"] }; // Array instead of string

      await controller.execute(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRestaurantServiceInstance.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Bad Request",
        message: "Missing or invalid 'message' parameter",
      });
    });

    it("should handle service errors with Error instance", async () => {
      const errorMessage = "OpenAI API error";
      const serviceError = new Error(errorMessage);
      mockRequest.query = { message: "find restaurants" };
      mockRestaurantServiceInstance.execute.mockRejectedValue(serviceError);

      await controller.execute(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRestaurantServiceInstance.execute).toHaveBeenCalledWith(
        "find restaurants"
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Error executing restaurant search:",
        serviceError
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        message: errorMessage,
      });
    });

    it("should handle service errors with non-Error instance", async () => {
      const serviceError = "String error";
      mockRequest.query = { message: "find restaurants" };
      mockRestaurantServiceInstance.execute.mockRejectedValue(serviceError);

      await controller.execute(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRestaurantServiceInstance.execute).toHaveBeenCalledWith(
        "find restaurants"
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Error executing restaurant search:",
        serviceError
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      });
    });
  });
});
