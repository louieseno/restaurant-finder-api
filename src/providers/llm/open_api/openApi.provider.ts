import config from "@config/config";
import OpenAI from "openai";
import { OpenApiJsonResponseDTO } from "./openApi.dto";
import { OpenApiJsonSchema } from "./openApi.schema";
import { z } from "zod";
export class OpenApiProvider {
  private static instance: OpenApiProvider;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPEN_API_KEY,
    });
  }

  public static getInstance(): OpenApiProvider {
    if (!OpenApiProvider.instance) {
      OpenApiProvider.instance = new OpenApiProvider();
    }
    return OpenApiProvider.instance;
  }

  async convertMessageToJSON(message: string): Promise<OpenApiJsonResponseDTO> {
    const systemPrompt = `You are a restaurant search assistant. Convert user messages into a structured JSON command.

      Output ONLY valid JSON with this exact structure:
      {
        "action": "restaurant_search",
        "parameters": {
          "query": "cuisine type or restaurant name",
          "near": "location",
          "min_price": "1-4 (1=cheap, 2=moderate, 3=expensive, 4=very expensive) // optional",
          "max_price": "1-4 (1=cheap, 2=moderate, 3=expensive, 4=very expensive) // optional",
          "open_now": true/false // optional,
          "sort": "sorting criteria (RELEVANCE, RATING, DISTANCE, POPULARITY)" // optional
        }
      }

      Rules:
      - Only include fields the user actually mentions.
      - Do not add any text outside the JSON.
      - Do NOT include trailing commas.
      - Do NOT include any explanation, comments, or text outside the JSON.
      - Map qualitative prices to numbers for min_price and max_price as follows:
        - cheap -> 1
        - moderate -> 2
        - expensive -> 3
        - very expensive -> 4
      - If a single price is mentioned, set min_price and max_price equal to that number.
      - If a range is mentioned, set min_price and max_price accordingly.
      - If the user mentions preference like "rating", "popular", or "closest", map it to the corresponding sort value:
        - "rating" → "RATING"
        - "closest", "nearest", "farthest" → "DISTANCE"
        - "popular", "trending", "most popular" → "POPULARITY"
        - if none is mentioned,  default to "RELEVANCE"
      - For open_now, determine based on keywords:
        - Set open_now to true ONLY when user mentions explicitly or similar to the following: "open now", "currently open", "open right now", "available now", "serving now", "operating now"
        - Set open_now to false when user mentions: "closed", "opening later", "will be open", "opens at", "closed now"
        - If no time-related keywords are mentioned, omit open_now entirely
      - If a field was not mentioned, omit it entirely except if default value of sorting is "RELEVANCE".
      `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from LLM");
      }

      const jsonResponse = JSON.parse(content);

      const validatedResponse = OpenApiJsonSchema.parse(jsonResponse);

      return validatedResponse;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Failed to parse LLM response as JSON");
      }
      if (error instanceof z.ZodError) {
        throw new Error(`LLM response validation error: ${error.message}`);
      }
      throw error;
    }
  }
}
