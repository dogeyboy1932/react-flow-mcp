import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

// import { MCP_SERVERS } from '../mcp_config';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { setupMCPServer } from '../mcpServers/_shared';


interface MCPTool {
  name: string;
  description: string;
  parameters: any;
}

class GeminiMCPClient {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private client: Client | null = null;
  private tools: MCPTool[] = [];
  private currentServer: McpServer | null = null;
  private currentServerName: string | null = null;


  // Connect Functions
  async connect(serverType: string = 'weather-mcp'): Promise<boolean> {
    try {
      // First, properly disconnect and stop any existing server
      await this.fullDisconnect();
      
      // Start the appropriate server based on type
      console.log(`🚀 Starting ${serverType} server...`);      

      // const serverPath = MCP_SERVERS[serverType as keyof typeof MCP_SERVERS].serverPath;
      // const { setupMCPServer } = await import(serverPath);
      this.currentServer = await setupMCPServer(serverType);

      this.currentServerName = serverType;

      
      // Longer delay to ensure server is properly started
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now connect client to the server
      const transport = new TabClientTransport({
        targetOrigin: window.location.origin
      });
      
      this.client = new Client({
        name: 'WebAppClient',
        version: '1.0.0',
      });

      await this.client.connect(transport);
      
      // Get tools from the connected server
      const toolList = await this.client.listTools();
      this.tools = toolList.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || tool.name,
        parameters: tool.inputSchema || {}
      }));

      console.log(`✅ Connected to ${serverType} with ${this.tools.length} tools:`, this.tools.map(t => t.name));
      this.updateModel();
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
  }


  async disconnect() {
    await this.fullDisconnect();
  }


  private async fullDisconnect() {
    console.log('🔌 Performing full disconnect...');
    
    // Disconnect client
    if (this.client) {
      try {
        this.client.close();
      } catch (error) {
        console.warn('Error closing client:', error);
      }
      this.client = null;
    }
    
    // Stop current server
    if (this.currentServer) {
      try {
        if (typeof this.currentServer.close === 'function') {
          await this.currentServer.close();
        }
      } catch (error) {
        console.warn('Error closing server:', error);
      }
      this.currentServer = null;
    }
    
    // Clear tools and update model
    this.tools = [];
    this.updateModel();
    
    // Additional delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
  }


  async callTool(toolName: string, args: any) {
    if (!this.client) return;
    return await this.client.callTool({
      name: toolName,
      arguments: args
    });
  }

  // Chat Functions
  async chat(message: string): Promise<string> {
    if (!this.model) return 'Please set your API key first.';

    try {
      const chat = this.model.startChat();
      const result = await chat.sendMessage(message);
      const response = result.response;

      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0 && this.client) {
        const functionResponses = [];
        for (const call of functionCalls) {
          try {
            const toolResult = await this.client.callTool({
              name: call.name,
              arguments: call.args
            });
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: toolResult
              }
            });
          } catch (error) {
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { error: 'Tool call failed' }
              }
            });
          }
        }
        const followUpResult = await chat.sendMessage(functionResponses);
        return followUpResult.response.text();
      }
      
      return response.text();
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }


  setApiKey(apiKey: string) {
    if (!apiKey) return;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.updateModel();
  }


  // Helper functions

  private updateModel() {
    if (this.genAI) {
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        tools: this.tools.length > 0 ? this.formatTools() : undefined
      });
    }
  }

  
  private formatTools() {
    return [{
      functionDeclarations: this.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: SchemaType.OBJECT,
          properties: this.convertParams(tool.parameters),
          required: tool.parameters.required || Object.keys(tool.parameters.properties || {})
        }
      }))
    }];
  }

  
  private convertParams(params: any): any {
    // console.log("Params 1 ", params)
    const properties: any = {};
    if (params.properties) {
      for (const [key, value] of Object.entries(params.properties)) {
        const param = value as any;
        properties[key] = {
          type: param.type === 'string' ? SchemaType.STRING : SchemaType.NUMBER,
          description: param.description || key
        };
      }
    }
    
    // console.log("Params 2 ", properties)
    return properties;
  }

  
  // Getters
  
  getTools(): MCPTool[] {
    return this.tools;
  }

  
  isConnected(): boolean {
    return this.client !== null;
  }

  getCurrentServer(): any {
    return this.currentServerName;
  }
}


export const geminiClient = new GeminiMCPClient(); 