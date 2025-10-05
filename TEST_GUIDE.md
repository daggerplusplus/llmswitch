# LLMSwitch Test Suite

This project includes a comprehensive unit test suite using Jest.

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Structure

### Test Files

- `start-server.test.js` - Tests for the HTTP server functionality
- `__tests__/gpu.test.js` - Tests for GPU API configuration and functionality

### Test Coverage

The test suite covers:

#### Server Tests (`start-server.test.js`)
- Environment variable handling (OLLAMA_HOST, OLLAMA_PORT, GPU_API_HOST, GPU_API_PORT)
- API config endpoint (`/api/config`)
- CORS headers
- File serving with correct MIME types
- Error handling (404, 500)
- Root path redirection to index.html

#### GPU API Tests (`__tests__/gpu.test.js`)
- GPU API URL configuration
- LocalStorage integration
- GPU section visibility based on configuration
- URL validation and sanitization
- GPU data fetching
- Error handling for API failures
- Environment variable integration

## Coverage Thresholds

The project maintains a minimum coverage of 70% for:
- Branches
- Functions
- Lines
- Statements

## Writing New Tests

### Example Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = someFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Best Practices

1. **Clear test names** - Use descriptive names that explain what is being tested
2. **Arrange-Act-Assert** - Follow the AAA pattern for test structure
3. **Mock external dependencies** - Mock file system, network calls, etc.
4. **Test edge cases** - Include tests for error conditions and boundary cases
5. **Keep tests isolated** - Each test should be independent and not rely on others

## Mocking

### Mock localStorage
```javascript
const localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = value; },
  clear() { this.store = {}; }
};
global.localStorage = localStorage;
```

### Mock fetch
```javascript
const mockFetch = jest.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' })
});
```

### Mock fs module
```javascript
jest.mock('fs');
const fs = require('fs');

fs.readFile.mockImplementation((path, callback) => {
  callback(null, 'file content');
});
```

## Continuous Integration

Tests should be run:
- Before committing code
- In CI/CD pipeline
- Before creating pull requests
- After installing new dependencies

## Troubleshooting

### Tests failing after changes
1. Run `npm install` to ensure dependencies are up to date
2. Clear Jest cache: `npx jest --clearCache`
3. Check for environment-specific issues

### Coverage not meeting thresholds
1. Review coverage report: `npm run test:coverage`
2. Open `coverage/lcov-report/index.html` in browser for detailed view
3. Add tests for uncovered code paths

## Configuration

Test configuration is in `jest.config.js`. Key settings:

- `testEnvironment: 'node'` - Default test environment
- `collectCoverageFrom` - Files to include in coverage
- `coverageThreshold` - Minimum coverage percentages
- `testMatch` - Patterns to find test files
