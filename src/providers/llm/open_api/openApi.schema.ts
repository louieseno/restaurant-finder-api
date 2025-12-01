import { z } from "zod";

export const OpenApiJsonSchema = z.object({
  action: z.literal("restaurant_search"),
  parameters: z.object({
    query: z.string({ error: "Quer value value is required." }),
    near: z.string({ error: "Near value is required." }),
    min_price: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .optional(),
    max_price: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .optional(),
    open_now: z.boolean().optional(),
    sort: z
      .union([
        z.literal("RELEVANCE"),
        z.literal("RATING"),
        z.literal("DISTANCE"),
        z.literal("POPULARITY"),
      ])
      .optional()
      .default("RELEVANCE"),
  }),
});

export type OpenApiJsonResponse = z.infer<typeof OpenApiJsonSchema>;
