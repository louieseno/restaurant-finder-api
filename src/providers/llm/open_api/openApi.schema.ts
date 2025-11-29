import { z } from "zod";

export const OpenApiJsonSchema = z.object({
  action: z.literal("restaurant_search"),
  parameters: z.object({
    query: z.string().optional(),
    near: z.string().optional(),
    price: z.enum(["1", "2", "3", "4"]).optional(),
    open_now: z.boolean().optional(),
    rating: z.number().optional(),
  }),
});

export type OpenApiJsonResponse = z.infer<typeof OpenApiJsonSchema>;
