import config from "@config/config";
import OpenAI from "openai";
import { OpenApiJsonResponseDTO } from "./openApi.dto";
import { OpenApiJsonSchema } from "./openApi.schema";

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
          "price": "1-4 (1=cheap, 2=moderate, 3=expensive, 4=very expensive) // optional",
          "open_now": true/false // optional,
          "rating": minimum rating number // optional
        }
      }

      Rules:
      - Only include fields the user actually mentions.
      - Do not add any text outside the JSON.
      - Do NOT include trailing commas.
      - Do NOT include any explanation, comments, or text outside the JSON.
      - price should be a string number from 1-4.
      - rating should be a number.
      - open_now should be boolean.
      - If a field was not mentioned, omit it entirely.
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
      throw error;
    }
  }
}
