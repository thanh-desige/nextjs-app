import type { Config } from "jest";

const config: Config = {
  // Use ts-jest to handle TypeScript
  preset: "ts-jest",

  // Default test environment
  testEnvironment: "node",

  // Root directory
  rootDir: ".",

  // Where to find tests
  roots: ["<rootDir>/src"],

  // Test file patterns
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
    "**/*.test.ts",
    "**/*.test.tsx",
  ],

  // Path alias mapping (mirrors tsconfig.json paths)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],

  // Transform TypeScript files
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/TrangChuAlubok/book/BookThietKeBocTach/src/core/**/*.ts",
    "src/TrangChuAlubok/book/BookThietKeBocTach/src/domain/**/*.ts",
    "!**/*.d.ts",
    "!**/index.ts",
    "!**/*.types.ts",
  ],

  // Coverage thresholds (will increase over time)
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 50,
  //     lines: 50,
  //     statements: 50,
  //   },
  // },
};

export default config;
