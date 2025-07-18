// Configuration
export const MCP_SERVERS = {
    'weather-mcp': {
      label: 'Weather MCP',
      position: { x: 400, y: 50 },
      url: 'mcp://weather-mcp',
      serverPath: '../mcpServers/weatherMCPServer',
    },
    'github-mcp': {
      label: 'GitHub MCP',
      position: { x: 400, y: 200 },
      url: 'mcp://github-mcp',
      serverPath: '../mcpServers/githubMCPServer',
    },
    'userTable-mcp': {
      label: 'Users MCP',
      position: { x: 400, y: 350 },
      url: 'mcp://users-mcp',
      serverPath: '../mcpServers/usersTableMCPServer',
    },
    // 'usersTable-mcp': {
    //   label: 'Users MCP',
    //   position: { x: 400, y: 350 },
    //   url: 'mcp://users-mcp',
    //   serverPath: '../mcpServers/usersTableMCPServer',
    // },
  } as const;