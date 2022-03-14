const { defaults } = require('jest-config');

module.exports = {
  bail: 1,
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  errorOnDeprecated: true,
  modulePathIgnorePatterns: [...defaults.modulePathIgnorePatterns, 'dist/.*'],
  preset: 'react-native',
  setupFilesAfterEnv: ['./test/setup.js', 'jest-extended'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/?(*.)+(spec|test).[tj]s?(x)'],
  verbose: true,
};
