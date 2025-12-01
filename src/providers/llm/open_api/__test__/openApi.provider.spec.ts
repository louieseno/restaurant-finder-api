import { logger } from "@config/logger";
import { OpenApiProvider } from "../openApi.provider";
import OpenAI from "openai";

// Mock the OpenAI module
jest.mock("openai");

// Mock config
jest.mock("@config/config", () => ({
  OPEN_API_KEY: "test-openai-api-key",
}));

// Mock the winston logger
jest.mock("@config/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe("OpenApiProvider", () => {
  let provider: OpenApiProvider;
  let mockChatCompletions: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the chat completions create method
    mockChatCompletions = jest.fn();

    // Mock OpenAI constructor and instance
    const mockOpenAIInstance = {
      chat: {
        completions: {
          create: mockChatCompletions,
        },
      },
    } as unknown as OpenAI;

    // Reset the singleton instance
    (OpenApiProvider as any).instance = undefined;
    mockOpenAI.mockImplementation(() => mockOpenAIInstance);

    // Reset the singleton instance
    (OpenApiProvider as any).instance = undefined;
    provider = OpenApiProvider.getInstance();
  });

  describe("getInstance", () => {
    it("should return a singleton instance", () => {
      const instance1 = OpenApiProvider.getInstance();
      const instance2 = OpenApiProvider.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("convertMessageToJSON", () => {
    // Test cases for required fields
    describe("required fields", () => {
      // Parse required fields correctly
      it("should convert required fields from restaurant search message to JSON", async () => {
        const message = "Find pizza near New York";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "pizza",
                    near: "New York",
                    sort: "RELEVANCE",
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        const result = await provider.convertMessageToJSON(message);

        expect(result).toEqual({
          action: "restaurant_search",
          parameters: {
            query: "pizza",
            near: "New York",
            sort: "RELEVANCE",
          },
        });

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });

      // Throw error if required near field is missing
      it("should throw an error if required 'near' field is missing in the LLM response", async () => {
        const message = "Find pizza places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "pizza",
                    // 'near' field is missing
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "LLM response validation error"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          expect.any(Object)
        );

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });

      // Throw error if required query field is missing
      it("should throw an error if required 'query' field is missing in the LLM response", async () => {
        const message = "Find places near New York";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    // 'query' field is missing
                    near: "New York",
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "LLM response validation error"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          expect.any(Object)
        );

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });

      // Throw error for both missing required fields
      it("should throw an error if both required fields are missing in the LLM response", async () => {
        const message = "Find places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    // both 'query' and 'near' fields are missing
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "LLM response validation error"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          expect.any(Object)
        );

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });
    });

    // Test case for optional fields
    describe("optional fields", () => {
      // Test min_price and max_price
      it("should handle min_price and max_price correctly", async () => {
        const message =
          "Find affordable sushi places in San Francisco with moderate prices.";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "sushi",
                    near: "San Francisco",
                    min_price: 1,
                    max_price: 2,
                    sort: "POPULARITY",
                  },
                }),
              },
            },
          ],
        };
        mockChatCompletions.mockResolvedValue(mockResponse);

        const result = await provider.convertMessageToJSON(message);

        expect(result).toEqual({
          action: "restaurant_search",
          parameters: {
            query: "sushi",
            near: "San Francisco",
            min_price: 1,
            max_price: 2,
            sort: "POPULARITY",
          },
        });

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });

      // Test open_now true
      it("should handle open_now correctly", async () => {
        const message =
          "Find Italian restaurants in Chicago that are open now.";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "Italian",
                    near: "Chicago",
                    open_now: true,
                    sort: "RELEVANCE",
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        const result = await provider.convertMessageToJSON(message);

        expect(result).toEqual({
          action: "restaurant_search",
          parameters: {
            query: "Italian",
            near: "Chicago",
            open_now: true,
            sort: "RELEVANCE",
          },
        });

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });

      // Test open_now false
      it("should handle open_now set to false correctly", async () => {
        const message =
          "Find Mexican restaurants in Los Angeles that are open later this evening.";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "Mexican",
                    near: "Los Angeles",
                    open_now: false,
                    sort: "RELEVANCE",
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        const result = await provider.convertMessageToJSON(message);

        expect(result).toEqual({
          action: "restaurant_search",
          parameters: {
            query: "Mexican",
            near: "Los Angeles",
            open_now: false,
            sort: "RELEVANCE",
          },
        });

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });

      // Test sorting by rating
      it("should handle sorting by rating correctly", async () => {
        const message = "Find pizza places in New York with 5 star rating.";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "pizza",
                    near: "New York",

                    sort: "RATING",
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        const result = await provider.convertMessageToJSON(message);

        expect(result).toEqual({
          action: "restaurant_search",
          parameters: {
            query: "pizza",
            near: "New York",
            sort: "RATING",
          },
        });

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });

      // Test sorting by relevance
      it("should handle sorting by relevance correctly", async () => {
        const message = "Find pizza places in New York.";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "pizza",
                    near: "New York",
                    sort: "RELEVANCE",
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        const result = await provider.convertMessageToJSON(message);

        expect(result).toEqual({
          action: "restaurant_search",
          parameters: {
            query: "pizza",
            near: "New York",
            sort: "RELEVANCE",
          },
        });

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });

      // Test sorting by distance
      it("should handle sorting by distance correctly", async () => {
        const message = "Find the nearest pizza places around New York.";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "pizza",
                    near: "New York",
                    sort: "DISTANCE",
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        const result = await provider.convertMessageToJSON(message);

        expect(result).toEqual({
          action: "restaurant_search",
          parameters: {
            query: "pizza",
            near: "New York",
            sort: "DISTANCE",
          },
        });

        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });

      // Test sorting by popularity
      it("should handle sorting by popularity correctly", async () => {
        const message = "Find popular pizza places in New York.";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "pizza",
                    near: "New York",
                    sort: "POPULARITY",
                  },
                }),
              },
            },
          ],
        };
        mockChatCompletions.mockResolvedValue(mockResponse);
        const result = await provider.convertMessageToJSON(message);
        expect(result).toEqual({
          action: "restaurant_search",
          parameters: {
            query: "pizza",
            near: "New York",
            sort: "POPULARITY",
          },
        });
        expect(mockChatCompletions).toHaveBeenCalledWith({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("restaurant search assistant"),
            },
            { role: "user", content: message },
          ],
          temperature: 0,
        });
      });
    });

    describe("error handling", () => {
      it("should throw 'No response from LLM' when choices array is empty", async () => {
        const message = "Find pizza places";
        const mockResponse = {
          choices: [],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "No response from LLM"
        );
      });

      it("should throw 'No response from LLM' when message content is null", async () => {
        const message = "Find pizza places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: null,
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "No response from LLM"
        );
      });

      it("should throw 'No response from LLM' when message content is undefined", async () => {
        const message = "Find pizza places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: undefined,
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "No response from LLM"
        );
      });

      it("should throw 'Failed to parse LLM response as JSON' when response is invalid JSON", async () => {
        const message = "Find pizza places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: "This is not valid JSON content",
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "Failed to parse LLM response as JSON"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          expect.any(SyntaxError)
        );
      });

      it("should throw 'Failed to parse LLM response as JSON' when response has malformed JSON", async () => {
        const message = "Find pizza places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: '{"action": "restaurant_search", "parameters": {', // incomplete JSON
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "Failed to parse LLM response as JSON"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          expect.any(SyntaxError)
        );
      });

      it("should throw 'LLM response validation error' when schema validation fails", async () => {
        const message = "Find pizza places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "invalid_action", // Invalid action
                  parameters: {
                    query: "pizza",
                    near: "New York",
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "LLM response validation error:"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          expect.any(Object)
        );
      });

      it("should throw 'LLM response validation error' when required field is missing", async () => {
        const message = "Find pizza places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "pizza",
                    // missing required 'near' field
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "LLM response validation error:"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          expect.any(Object)
        );
      });

      it("should throw 'LLM response validation error' when price values are invalid", async () => {
        const message = "Find expensive pizza places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "pizza",
                    near: "New York",
                    min_price: 5, // Invalid price (should be 1-4)
                    max_price: 3,
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "LLM response validation error:"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          expect.any(Object)
        );
      });

      it("should throw 'LLM response validation error' when sort value is invalid", async () => {
        const message = "Find pizza places";
        const mockResponse = {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: "restaurant_search",
                  parameters: {
                    query: "pizza",
                    near: "New York",
                    sort: "INVALID_SORT", // Invalid sort option
                  },
                }),
              },
            },
          ],
        };

        mockChatCompletions.mockResolvedValue(mockResponse);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "LLM response validation error:"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          expect.any(Object)
        );
      });

      it("should propagate OpenAI API errors", async () => {
        const message = "Find pizza places";
        const apiError = new Error("OpenAI API rate limit exceeded");

        mockChatCompletions.mockRejectedValue(apiError);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "OpenAI API rate limit exceeded"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          apiError
        );
      });

      it("should propagate network errors", async () => {
        const message = "Find pizza places";
        const networkError = new Error("Network request failed");

        mockChatCompletions.mockRejectedValue(networkError);

        await expect(provider.convertMessageToJSON(message)).rejects.toThrow(
          "Network request failed"
        );

        expect(logger.error).toHaveBeenCalledWith(
          "Error in OpenApiProvider.convertMessageToJSON:",
          networkError
        );
      });
    });
  });
});
