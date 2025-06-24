// Jest setup file for additional configuration

// Increase timeout for scraping tests
jest.setTimeout(30000);

// Mock console.log for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for testing - using a simple mock instead of importing node-fetch
global.fetch = jest.fn();