import { FourSquareApiProvider } from "@providers/four_square/fourSquareApi.provider";
import { OpenApiProvider } from "@providers/llm/open_api/openApi.provider";

export class RestaurantService {
  private static instance: RestaurantService;
  private openApiProvider: OpenApiProvider;
  private fourSquareApiProvider: FourSquareApiProvider;

  private constructor() {
    this.openApiProvider = OpenApiProvider.getInstance();
    this.fourSquareApiProvider = FourSquareApiProvider.getInstance();
  }

  public static getInstance(): RestaurantService {
    if (!RestaurantService.instance) {
      RestaurantService.instance = new RestaurantService();
    }
    return RestaurantService.instance;
  }

  async execute(message: string) {
    const command = await this.openApiProvider.convertMessageToJSON(message);
    const response = await this.fourSquareApiProvider.searchRestaurants(
      command.parameters
    );
    return {
      response,
    };
  }
}
