# Restaurant Finder API

A powerful **LLM-Driven Restaurant Finder API** that leverages artificial intelligence to understand natural language queries and find restaurants based on user preferences. Users can enter free-form messages describing what they want to do, and the API will intelligently parse their intent and return relevant restaurant recommendations.

## Features

- **Natural Language Processing**: Powered by OpenAI to understand user intent
- **Location-Based Search**: Integration with Foursquare API for accurate restaurant data
- **Secure API**: Built-in authentication and rate limiting
- **Comprehensive Testing**: Full test coverage with Jest
- **Structured Logging**: Winston-based logging system
- **Modular Architecture**: Clean, maintainable code structure inspired by NestJS

## Setup

### Engine Locking & Version Management

This project uses strict engine locking to ensure consistency across development environments:

```json
{
  "engines": {
    "node": "24.11.1",
    "npm": "11.6.2"
  },
  "engineStrict": true,
  "packageManager": "npm@11.6.2"
}
```

**Prerequisites:**

- Node.js `24.11.1`
- npm `11.6.2`

### Package Manager

This project uses **npm** as the package manager. Make sure you have the correct version installed:

```bash
npm --version  # Should output 11.6.2
node --version # Should output v24.11.1
```

### Dependencies

#### Core Dependencies

- **express** `^5.1.0` - Web application framework
- **axios** `^1.13.2` - HTTP client for API requests
- **winston** `^3.18.3` - Logging library
- **openai** `^6.9.1` - OpenAI API client
- **zod** `^4.1.13` - Schema validation
- **express-rate-limit** `^8.2.1` - Rate limiting middleware

#### Development Dependencies

- **jest** `^30.2.0` - Testing framework
- **typescript** `^5.9.3` - TypeScript support
- **tsx** `^4.20.6` - TypeScript execution engine
- **supertest** `^7.1.4` - HTTP assertion testing

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication
ENDPOINT_SECRET_CODE=your-secret-code-here

# Foursquare API Configuration
FSQ_PLACES_BASE_URL=https://places-api.foursquare.com
FSQ_API_KEY=your-foursquare-api-key

# OpenAI Configuration
OPEN_API_KEY=your-openai-api-key
```

**Required API Keys:**

- **Foursquare API Key**: Get yours at [Foursquare Developers](https://developer.foursquare.com/)
- **OpenAI API Key**: Get yours at [OpenAI Platform](https://platform.openai.com/)

### Installation & Running

1. **Clone the repository**

   ```bash
   git clone https://github.com/louieseno/restaurant-finder-api.git
   cd restaurant-finder-api
   ```

2. **Install and use the correct Node.js version**

   ```bash
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Run the application**

   **Development mode (with hot reload):**

   ```bash
   npm run dev
   ```

   **Production mode:**

   ```bash
   npm run build
   npm run start:prod
   ```

   **Standard start:**

   ```bash
   npm start
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## Architecture

This project follows a **modular architecture** inspired by NestJS, implemented with Express.js. The structure promotes separation of concerns, maintainability, and scalability.

### Project Structure

```
src/
├── index.ts                          # Application entry point
├── config/                           # Configuration files
│   ├── config.ts                     # Environment configuration
│   └── logger.ts                     # Winston logger setup
├── modules/                          # Feature modules
│   ├── _config/                      # Global configuration module
│   │   ├── middlewares/              # Global middlewares
│   │   │   ├── authenticate.ts       # Authentication middleware
│   │   │   ├── logger.ts             # Request logging middleware
│   │   │   └── rateLimit.ts          # Rate limiting middleware
│   │   └── routes/                   # Route configuration
│   │       └── v1.ts                 # API v1 routes
│   └── restaurant/                   # Restaurant module
│       ├── restaurant.route.ts       # Route definitions
│       ├── restaurant.controller.ts  # Request handlers
│       ├── restaurant.service.ts     # Business logic
│       └── __test__/                 # Module tests
│           ├── restaurant.controller.spec.ts
│           ├── restaurant.route.spec.ts
│           └── restaurant.service.spec.ts
└── providers/                        # Third-party integrations
    ├── four_square/                  # Foursquare API integration
    │   ├── fourSquareApi.dto.ts      # Data transfer objects
    │   ├── fourSquareApi.provider.ts # API client implementation
    │   └── __test__/                 # Provider tests
    │       └── fourSquareApi.provider.spec.ts
    └── llm/                          # LLM integrations
        └── open_api/                 # OpenAI integration
            ├── openApi.dto.ts        # Data transfer objects
            ├── openApi.provider.ts   # API client implementation
            ├── openApi.schema.ts     # Validation schemas
            └── __test__/             # Provider tests
                └── openApi.provider.spec.ts
```

### Architecture Principles

#### **Modular Design**

- **Modules**: Self-contained features with their own routes, controllers, and services
- **Providers**: Third-party service integrations (Foursquare, OpenAI)
- **Config**: Global configuration and middleware management

#### **Request Flow**

1. **Route** → Defines API endpoints and middleware chain
2. **Controller** → Handles HTTP requests and responses
3. **Service** → Contains business logic and orchestrates providers
4. **Provider** → Manages third-party API interactions

#### **Middleware Stack**

- **Authentication**: Validates API access using secret codes
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Logging**: Comprehensive request/response logging with Winston
- **Error Handling**: Centralized error management

## API Usage

### Authentication

All endpoints require authentication via the `code` query parameter:

```bash
curl "http://localhost:3000/api/v1/execute?message=your-encoded-message&code=your-secret-code"
```

### Find Restaurants

Send natural language queries to find restaurants using the execute endpoint with URL-encoded message and code:

```bash
curl "http://localhost:3000/api/v1/execute?message=Find%20me%20a%20cheap%20sushi%20restaurant%20in%20downtown%20Los%20Angeles%20that's%20open%20now%20and%20has%20at%20least%20a%204-star%20rating&code=pioneerdevai"
```

### Sample Response

The API returns restaurant data with the following structure:

```json
{
  "fsq_place_id": "562796d5498e03dd35da0f5e",
  "name": "Whole Foods Market",
  "address": "788 S Grand Ave (at W 8th St), Los Angeles, CA 90017",
  "cuisine": "Grocery Store, Health Food Store, Organic Grocery"
}
```

### API Limitations

The following fields are **not included** in the response due to Foursquare API limitations and are only accessible with a premium account:

- **Rating (optional)**
- **Price Level (optional)**
- **Operating Hours (optional)**

### Rate Limiting

To protect against excessive API usage and control billing costs, the API implements strict rate limiting:

- **Limit**: 3 requests per 5 minutes per IP address
- **Purpose**: Prevents API abuse and controls third-party service costs (OpenAI + Foursquare)
- **Response**: Returns `429 Too Many Requests` when limit is exceeded
- **Reset**: Rate limit window resets every 5 minutes

**Recommended Usage Pattern:**

- Cache results locally when possible
- Batch multiple location queries into a single request
- Consider the rate limit when integrating with frontend applications

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## License

This project is licensed under the ISC License.

---
