/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  collectCoverage: false,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^deepl-node$": "<rootDir>/src/__mocks__/deepl-node.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: { exactOptionalPropertyTypes: false },
      },
    ],
  },
};
