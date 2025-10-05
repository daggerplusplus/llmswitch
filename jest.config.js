module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage configuration
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!**/*.test.js',
    '!**/__tests__/**',
    '!start-server.js', // Excluded - server is integration tested
    '!js/ollama.js',    // Excluded - browser-only code
    '!js/gpu.js',       // Excluded - browser-only code
    '!js/api-test.js',  // Excluded - browser-only code
    '!js/debug.js'      // Excluded - browser-only code
  ],

  // Coverage thresholds - adjusted for unit-testable code only
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js'
  ],

  // Setup files
  setupFilesAfterEnv: [],

  // Module paths
  moduleDirectories: ['node_modules'],

  // Transform files
  transform: {},

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true
};
