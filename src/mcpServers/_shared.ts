import { MCP_SERVERS } from "./_mcp_config";
import { TabServerTransport } from "@mcp-b/transports";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const modules = import.meta.glob('./*MCPServer.ts');

export async function setupMCPServer(serverType: string): Promise<McpServer> {
  console.log(`👤 Setting up ${serverType} MCP Server...`);

  const serverName = MCP_SERVERS[serverType as keyof typeof MCP_SERVERS].label;
  const path = `./${serverType}MCPServer.ts`;

  if (!modules[path]) {
    throw new Error(`Unknown server type: ${serverType}`);
  }

  const module = await modules[path]();
  const createMcpServer = (module as { createMcpServer: () => McpServer }).createMcpServer;

  try {
    const transport: TabServerTransport = new TabServerTransport({
      allowedOrigins: ['*']
    });

    const server = createMcpServer();
    await server.connect(transport);

    console.log(`✅ ${serverName} MCP Server connected and ready`);
    return server;
  } catch (error) {
    console.error(`❌ Error setting up ${serverName} MCP Server:`, error);
    throw error;
  }
}
