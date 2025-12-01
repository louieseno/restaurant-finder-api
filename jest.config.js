/** @type {import("jest").Config} */
export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@providers/(.*)$": "<rootDir>/src/providers/$1",
  },
  testMatch: ["**/__test__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  testTimeout: 10000,
};
