// Configuration
export const MCP_SERVERS = {
    'weather': {
      label: 'Weather MCP',
      position: { x: 400, y: 50 },
      url: 'mcp://weather-mcp',
      serverPath: '../mcpServers/weatherMCPServer',
    },
    'github': {
      label: 'GitHub MCP',
      position: { x: 400, y: 200 },
      url: 'mcp://github-mcp',
      serverPath: '../mcpServers/githubMCPServer',
    },
    'userTable': {
      label: 'Users MCP',
      position: { x: 400, y: 350 },
      url: 'mcp://users-mcp',
      serverPath: '../mcpServers/usersTableMCPServer',
    },
    'math': {
      label: 'Math MCP',
      position: { x: 400, y: 500 },
      url: 'mcp://math-mcp',
      serverPath: '../mcpServers/mathMCPServer',
    },
  } as const;