import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

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

  setApiKey(apiKey: string) {
    if (!apiKey) return;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.updateModel();
  }

  async connect(): Promise<boolean> {
    try {
      // First, start the weather server
      const { setupWeatherMCPServer } = await import('./weatherMCPServer');
      console.log('🌤️ Starting weather server...');
      await setupWeatherMCPServer();
      
      // Small delay to ensure server is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
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

      console.log('✅ Connected to MCP server with tools:', this.tools);
      this.updateModel();
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
  }

  disconnect() {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.tools = [];
      this.updateModel();
    }
  }

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
    return properties;
  }

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

  getTools(): MCPTool[] {
    return this.tools;
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

export const geminiClient = new GeminiMCPClient(); 