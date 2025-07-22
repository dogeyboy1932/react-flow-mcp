import { MCP_SERVERS } from "./_mcp_config";
import { TabServerTransport } from "@mcp-b/transports";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

  
export async function setupMCPServer(serverType: string): Promise<McpServer> {
    console.log(`👤 Setting up ${serverType} MCP Server...`);

    const serverPath = MCP_SERVERS[serverType as keyof typeof MCP_SERVERS].serverPath;
    const serverName = MCP_SERVERS[serverType as keyof typeof MCP_SERVERS].label;

    const { createMcpServer } = await import(/* @vite-ignore */ serverPath);

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