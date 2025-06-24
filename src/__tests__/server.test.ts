import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

// Mock the components
jest.mock('../cache.js');
jest.mock('../scraper.js');
jest.mock('../resources.js');
jest.mock('../tools.js');

describe('AppleHIGMCPServer', () => {
  let mockServer: jest.Mocked<Server>;

  beforeEach(() => {
    mockServer = {
      setRequestHandler: jest.fn(),
      connect: jest.fn()
    } as any;
    
    (Server as jest.MockedClass<typeof Server>).mockImplementation(() => mockServer);
  });

  test('should initialize server with correct configuration', () => {
    // Import after mocking
    require('../server.js');

    expect(Server).toHaveBeenCalledWith(
      {
        name: 'apple-hig-mcp',
        version: '1.0.0',
        description: 'Model Context Protocol server for Apple Human Interface Guidelines',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );
  });

  test('should set up request handlers', () => {
    // Import after mocking
    require('../server.js');

    // Should have called setRequestHandler for each handler
    expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(4); // ListResources, ReadResource, ListTools, CallTool
  });
});

describe('MCP Handler Integration', () => {
  // Integration tests would go here, testing the actual request/response flow
  // These would require more complex mocking of the MCP infrastructure
  
  test('should handle resource listing', async () => {
    // This would test the actual ListResourcesRequest handler
    // Implementation depends on how you want to structure integration tests
  });

  test('should handle tool calls', async () => {
    // This would test the actual CallToolRequest handler
    // Implementation depends on how you want to structure integration tests
  });
});