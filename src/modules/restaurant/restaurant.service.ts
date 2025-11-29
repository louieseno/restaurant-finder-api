import { OpenApiProvider } from "@providers/llm/open_api/openApi.provider";

export class RestaurantService {
  private static instance: RestaurantService;
  private openApiProvider: OpenApiProvider;

  private constructor() {
    this.openApiProvider = OpenApiProvider.getInstance();
  }

  public static getInstance(): RestaurantService {
    if (!RestaurantService.instance) {
      RestaurantService.instance = new RestaurantService();
    }
    return RestaurantService.instance;
  }

  async execute(message: string) {
    const command = await this.openApiProvider.convertMessageToJSON(message);

    return {
      query: message,
      command: command,
    };
  }
}
