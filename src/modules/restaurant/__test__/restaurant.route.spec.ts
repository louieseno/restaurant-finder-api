import request from "supertest";
import express from "express";
import { RestaurantRoute } from "../restaurant.route";
import { RestaurantController } from "../restaurant.controller";
import config from "@config/config";

// Mock dependencies
jest.mock("../restaurant.controller");
jest.mock("@config/config", () => ({
  ENDPOINT_SECRET_CODE: "test-secret-code",
}));

// Mock rate limiting middleware
jest.mock("@modules/_config/middlewares/rateLimit", () => ({
  executeLimiter: jest.fn((req: any, res: any, next: any) => next()),
}));

const mockedRestaurantController = RestaurantController as jest.Mocked<
  typeof RestaurantController
>;

describe("RestaurantRoute", () => {
  let app: express.Application;
  let mockControllerInstance: jest.Mocked<RestaurantController>;
  let mockExecuteMethod: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset singleton instance
    (RestaurantRoute as any).instance = undefined;

    // Create mock controller instance
    mockExecuteMethod = jest.fn();
    mockControllerInstance = {
      execute: mockExecuteMethod,
    } as unknown as jest.Mocked<RestaurantController>;

    // Mock controller singleton
    mockedRestaurantController.getInstance = jest
      .fn()
      .mockReturnValue(mockControllerInstance);

    // Create Express app with the route
    app = express();
    app.use(express.json());
    app.use("/api/v1", RestaurantRoute.getInstanceRouter());
  });

  describe("getInstanceRouter", () => {
    it("should return the same router instance (singleton pattern)", () => {
      const router1 = RestaurantRoute.getInstanceRouter();
      const router2 = RestaurantRoute.getInstanceRouter();
      expect(router1).toBe(router2);
    });

    it("should create RestaurantController instance", () => {
      RestaurantRoute.getInstanceRouter();
      expect(mockedRestaurantController.getInstance).toHaveBeenCalled();
    });
  });

  describe("GET /execute", () => {
    const validSecretCode = config.ENDPOINT_SECRET_CODE;
    const mockRestaurantData = {
      success: true,
      data: {
        response: [
          {
            fsq_place_id: "12345",
            name: "Pizza Palace",
            address: "123 Main St, New York, NY",
            cuisine: "Pizza, Italian",
          },
        ],
      },
    };

    it("should successfully execute restaurant search with valid code and message", async () => {
      mockExecuteMethod.mockImplementation((req, res) => {
        res.status(200).json(mockRestaurantData);
      });

      const response = await request(app).get("/api/v1/execute").query({
        code: validSecretCode,
        message: "find pizza near me",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRestaurantData);
      expect(mockExecuteMethod).toHaveBeenCalled();
    });

    it("should return 401 when secret code is missing", async () => {
      const response = await request(app).get("/api/v1/execute").query({
        message: "find pizza near me",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
        message: "Invalid or missing access code",
      });
      expect(mockExecuteMethod).not.toHaveBeenCalled();
    });

    it("should return 401 when secret code is invalid", async () => {
      const response = await request(app).get("/api/v1/execute").query({
        code: "invalid-code",
        message: "find pizza near me",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
        message: "Invalid or missing access code",
      });
      expect(mockExecuteMethod).not.toHaveBeenCalled();
    });

    it("should return 401 when secret code is empty string", async () => {
      const response = await request(app).get("/api/v1/execute").query({
        code: "",
        message: "find pizza near me",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized",
        message: "Invalid or missing access code",
      });
      expect(mockExecuteMethod).not.toHaveBeenCalled();
    });

    it("should pass through to controller when both code and message are valid", async () => {
      mockExecuteMethod.mockImplementation((req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app).get("/api/v1/execute").query({
        code: validSecretCode,
        message: "find Italian restaurants",
      });

      expect(response.status).toBe(200);
      expect(mockExecuteMethod).toHaveBeenCalled();

      // Verify the controller method was called with correct parameters
      const callArgs = mockExecuteMethod.mock.calls[0];
      expect(callArgs[0].query.code).toBe(validSecretCode);
      expect(callArgs[0].query.message).toBe("find Italian restaurants");
    });

    it("should handle controller errors", async () => {
      mockExecuteMethod.mockImplementation((req, res) => {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Something went wrong",
        });
      });

      const response = await request(app).get("/api/v1/execute").query({
        code: validSecretCode,
        message: "find restaurants",
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Internal Server Error",
        message: "Something went wrong",
      });
      expect(mockExecuteMethod).toHaveBeenCalled();
    });

    it("should handle controller validation errors", async () => {
      mockExecuteMethod.mockImplementation((req, res) => {
        res.status(400).json({
          error: "Bad Request",
          message: "Missing or invalid 'message' parameter",
        });
      });

      const response = await request(app).get("/api/v1/execute").query({
        code: validSecretCode,
        // missing message parameter
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Bad Request",
        message: "Missing or invalid 'message' parameter",
      });
      expect(mockExecuteMethod).toHaveBeenCalled();
    });

    it("should work with complex query messages", async () => {
      const complexMessage =
        "find expensive Italian restaurants that are open now near Central Park";

      mockExecuteMethod.mockImplementation((req, res) => {
        res.status(200).json(mockRestaurantData);
      });

      const response = await request(app).get("/api/v1/execute").query({
        code: validSecretCode,
        message: complexMessage,
      });

      expect(response.status).toBe(200);
      expect(mockExecuteMethod).toHaveBeenCalled();

      const callArgs = mockExecuteMethod.mock.calls[0];
      expect(callArgs[0].query.message).toBe(complexMessage);
    });

    it("should work with special characters in message", async () => {
      const messageWithSpecialChars = "find café & bistro near 5th street";

      mockExecuteMethod.mockImplementation((req, res) => {
        res.status(200).json(mockRestaurantData);
      });

      const response = await request(app).get("/api/v1/execute").query({
        code: validSecretCode,
        message: messageWithSpecialChars,
      });

      expect(response.status).toBe(200);
      expect(mockExecuteMethod).toHaveBeenCalled();
    });

    it("should handle URL encoded query parameters", async () => {
      const messageWithSpaces = "find pizza places near Times Square";

      mockExecuteMethod.mockImplementation((req, res) => {
        res.status(200).json(mockRestaurantData);
      });

      const response = await request(app).get("/api/v1/execute").query({
        code: validSecretCode,
        message: messageWithSpaces,
      });

      expect(response.status).toBe(200);
      expect(mockExecuteMethod).toHaveBeenCalled();

      const callArgs = mockExecuteMethod.mock.calls[0];
      expect(callArgs[0].query.message).toBe(messageWithSpaces);
    });

    it("should preserve additional query parameters", async () => {
      mockExecuteMethod.mockImplementation((req, res) => {
        res.status(200).json(mockRestaurantData);
      });

      const response = await request(app).get("/api/v1/execute").query({
        code: validSecretCode,
        message: "find pizza",
        additional: "parameter",
      });

      expect(response.status).toBe(200);
      expect(mockExecuteMethod).toHaveBeenCalled();

      const callArgs = mockExecuteMethod.mock.calls[0];
      expect(callArgs[0].query.additional).toBe("parameter");
    });
  });
});
