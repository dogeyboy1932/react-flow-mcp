import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Define Zod schemas for validation
const MathArgumentsSchema = z.object({
  a: z.number(),
  b: z.number(),
});

const PowerArgumentsSchema = z.object({
  base: z.number(),
  exponent: z.number(),
});

// Create server instance
const server = new Server(
  {
    name: "calculator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add",
        description: "Add two numbers",
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number" },
          },
          required: ["a", "b"],
        },
      },
      {
        name: "multiply",
        description: "Multiply two numbers", 
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number", description: "First number" },
            b: { type: "number", description: "Second number" },
          },
          required: ["a", "b"],
        },
      },
      {
        name: "power",
        description: "Calculate base raised to the power of exponent",
        inputSchema: {
          type: "object", 
          properties: {
            base: { type: "number", description: "Base number" },
            exponent: { type: "number", description: "Exponent" },
          },
          required: ["base", "exponent"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "add") {
      const { a, b } = MathArgumentsSchema.parse(args);
      const result = a + b;
      
      return {
        content: [
          {
            type: "text",
            text: `🧮 ${a} + ${b} = ${result}`,
          },
        ],
      };
    } else if (name === "multiply") {
      const { a, b } = MathArgumentsSchema.parse(args);
      const result = a * b;
      
      return {
        content: [
          {
            type: "text", 
            text: `🧮 ${a} × ${b} = ${result}`,
          },
        ],
      };
    } else if (name === "power") {
      const { base, exponent } = PowerArgumentsSchema.parse(args);
      const result = Math.pow(base, exponent);
      
      return {
        content: [
          {
            type: "text",
            text: `🧮 ${base}^${exponent} = ${result}`,
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Calculator MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 