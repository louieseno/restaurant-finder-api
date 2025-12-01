export interface OpenApiJsonParametersDTO {
  query?: string;
  near?: string;
  min_price?: 1 | 2 | 3 | 4;
  max_price?: 1 | 2 | 3 | 4;
  open_now?: boolean;
  sort?: "RELEVANCE" | "RATING" | "DISTANCE" | "POPULARITY";
}

export interface OpenApiJsonResponseDTO {
  action: "restaurant_search";
  parameters: OpenApiJsonParametersDTO;
}
