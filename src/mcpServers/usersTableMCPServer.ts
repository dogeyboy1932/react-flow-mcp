import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TabServerTransport } from '@mcp-b/transports';
import { z } from 'zod';

// In-memory user storage (in a real app, this would be a database)
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

let users: User[] = [];

// Helper function to generate fake user data
function generateFakeUser(): Omit<User, 'id' | 'createdAt'> {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com'];
  const streets = ['Main St', 'Oak Ave', 'Park Rd', 'First St', 'Second St', 'Elm St', 'Cedar Ave', 'Pine St'];
  const cities = ['Springfield', 'Franklin', 'Georgetown', 'Clinton', 'Madison', 'Washington', 'Arlington', 'Salem'];
  const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'MI', 'GA', 'NC'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];

  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    address: `${Math.floor(Math.random() * 9999) + 1} ${street}, ${city}, ${state} ${Math.floor(Math.random() * 90000) + 10000}`
  };
}

// Helper function to create a user
function createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  const user: User = {
    id: Math.random().toString(36).substr(2, 9),
    ...userData,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  return user;
}

// Helper function to send users to frontend
function sendUsersToFrontend(): string {
  if (users.length === 0) {
    return `
      <div style="text-align: center; padding: 20px; color: #666;">
        <p>No users found. Create some users to see them here!</p>
      </div>
    `;
  }

  const tableRows = users.map(user => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.id}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.email}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.phone}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.address}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(user.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');

  return `
    <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f5f5f5; position: sticky; top: 0;">
            <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">ID</th>
            <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Name</th>
            <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Email</th>
            <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Phone</th>
            <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Address</th>
            <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Created</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    <div style="margin-top: 10px; text-align: center; color: #666; font-size: 14px;">
      Total Users: ${users.length}
    </div>
  `;
}

// Create and configure Users MCP server
function createUsersMcpServer(): McpServer {
  const server = new McpServer({
    name: "users-mcp",
    version: "1.0.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  // Create a new user
  server.tool(
    'create-user',
    {
      name: z.string().describe('Full name of the user'),
      email: z.string().email().describe('Email address of the user'),
      phone: z.string().describe('Phone number of the user'),
      address: z.string().describe('Physical address of the user')
    },
    async ({ name, email, phone, address }) => {
      console.log(`👤 Users: Creating user ${name}`);
      
      // Check if email already exists
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return {
          content: [{
            type: 'text',
            text: `❌ A user with email "${email}" already exists.`
          }]
        };
      }

      try {
        const user = createUser({ name, email, phone, address });
        
        return {
          content: [{
            type: 'text',
            text: `✅ User created successfully!\n\n👤 **${user.name}**\n📧 ${user.email}\n📞 ${user.phone}\n🏠 ${user.address}\n🆔 ID: ${user.id}`
          }]
        };
      } catch (error) {
        console.error('Failed to create user:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Create a random user
  server.tool(
    'create-random-user',
    {
      count: z.number().min(1).max(10).default(1).describe('Number of random users to create (1-10)')
    },
    async ({ count = 1 }) => {
      console.log(`👤 Users: Creating ${count} random user(s)`);
      
      try {
        const createdUsers: User[] = [];
        
        for (let i = 0; i < count; i++) {
          const fakeData = generateFakeUser();
          // Ensure email uniqueness
          let attempts = 0;
          while (users.some(u => u.email === fakeData.email) && attempts < 10) {
            Object.assign(fakeData, generateFakeUser());
            attempts++;
          }
          
          const user = createUser(fakeData);
          createdUsers.push(user);
        }
        
        const usersList = createdUsers.map(user => 
          `👤 **${user.name}** (${user.email})`
        ).join('\n');
        
        return {
          content: [{
            type: 'text',
            text: `✅ Successfully created ${count} random user(s):\n\n${usersList}`
          }]
        };
      } catch (error) {
        console.error('Failed to create random users:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to create random users: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Get all users
  server.tool(
    'get-all-users',
    {},
    async () => {
      console.log(`👤 Users: Getting all users (${users.length} total)`);
      
      if (users.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `📋 No users found. Create some users first!`
          }]
        };
      }

      const usersList = users.map(user => 
        `👤 **${user.name}** (ID: ${user.id})\n📧 ${user.email}\n📞 ${user.phone}\n🏠 ${user.address}\n📅 Created: ${new Date(user.createdAt).toLocaleDateString()}`
      ).join('\n\n---\n\n');

      return {
        content: [{
          type: 'text',
          text: `📋 All Users (${users.length} total):\n\n${usersList}`
        }]
      };
    }
  );

  // Show users table
  server.tool(
    'show-users-table',
    {},
    async () => {
      console.log(`📊 Users: Showing users table`);
      
      const tableHtml = sendUsersToFrontend();
      
      return {
        content: [{
          type: 'text',
          text: `📊 Users Table:\n\n${tableHtml}`
        }]
      };
    }
  );

  // Delete a user
  server.tool(
    'delete-user',
    {
      id: z.string().describe('User ID to delete')
    },
    async ({ id }) => {
      console.log(`👤 Users: Deleting user ${id}`);
      
      const userIndex = users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        return {
          content: [{
            type: 'text',
            text: `❌ User with ID "${id}" not found.`
          }]
        };
      }

      const deletedUser = users.splice(userIndex, 1)[0];
      
      return {
        content: [{
          type: 'text',
          text: `✅ User "${deletedUser.name}" (${deletedUser.email}) has been deleted.`
        }]
      };
    }
  );

  // Clear all users
  server.tool(
    'clear-all-users',
    {},
    async () => {
      console.log(`👤 Users: Clearing all users`);
      
      const count = users.length;
      users = [];
      
      return {
        content: [{
          type: 'text',
          text: `✅ All ${count} users have been cleared.`
        }]
      };
    }
  );

  return server;
}

function createTransport(): TabServerTransport {
  const transport = new TabServerTransport({
    allowedOrigins: ['*']
  });

  return transport;
}

export async function setupMCPServer(): Promise<McpServer> {
  console.log('👤 Setting up Users MCP Server...');
  
  try {
    const transport: TabServerTransport = createTransport();
    const server = createUsersMcpServer();

    await server.connect(transport);
    
    console.log('✅ Users MCP Server connected and ready');
    return server;
  } catch (error) {
    console.error('❌ Error setting up Users MCP Server:', error);
    throw error;
  }
}