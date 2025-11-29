export interface OpenApiJsonParametersDTO {
  query?: string;
  near?: string;
  price?: "1" | "2" | "3" | "4";
  open_now?: boolean;
  rating?: number;
}

export interface OpenApiJsonResponseDTO {
  action: "restaurant_search";
  parameters: OpenApiJsonParametersDTO;
}
