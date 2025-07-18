# Simple React Flow MCP Client

A streamlined React Flow application that connects a Gemini LLM node to MCP (Model Context Protocol) servers through a clean visual interface. Features dynamic configuration loading and a functional weather MCP server.

## ✨ Features

- 🎯 **Clean Visual Interface**: Simple drag-and-drop connection between LLM and MCP server nodes
- 🤖 **Google Gemini Integration**: Uses Gemini 1.5 Flash with secure API key input
- 🌤️ **Weather MCP Server**: Mock weather data with current conditions and 5-day forecasts
- 📁 **Dynamic Configuration**: Loads MCP servers from `mcp.json` configuration file
- 💬 **Enhanced Chat Interface**: Readable sidebar with improved contrast and typography
- 🔄 **Real-time Status**: Visual feedback for connections and tool availability

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Application**:
   ```bash
   npm run dev
   ```

3. **Open Browser**: Navigate to `http://localhost:3000`

4. **Use the Application**:
   - Enter your Google Gemini API key in the top-left field
   - Drag from the LLM node (blue) to the Weather MCP node (orange)
   - Watch the node turn green when connected
   - Start chatting with the enhanced LLM!

## 🌤️ Real Weather Data Integration

The application now includes **real weather data** powered by the National Weather Service (NWS) API:

### 🔧 Available Weather Tools
- **get_current_weather**: Get real current weather for any US city
- **get_weather_forecast**: Get detailed forecast using coordinates
- **get_weather_alerts**: Get official weather alerts for US states

### 🌍 Real Weather Examples
```
"What's the current weather in San Francisco, CA?"
"Get me weather alerts for Texas"
"Show me the forecast for 40.7128, -74.0060" (NYC coordinates)
"Current weather in Chicago, IL"
"Are there any weather warnings for Florida?"
```

### 📡 Data Sources
- **NWS API**: Official US National Weather Service data
- **Geocoding**: OpenStreetMap Nominatim for city-to-coordinate conversion
- **Coverage**: United States locations only
- **Updates**: Real-time weather information

*Note: The weather service only supports US locations. International weather requires different APIs.*

## 📁 Configuration

The application reads MCP server configurations from `public/mcp.json`. Currently configured with:

- **Weather MCP**: **Real NWS weather data** (fully functional)
- **Browser Tools MCP**: Browser automation tools (from mcp.json)
- **Solana MCP**: Blockchain operations (from mcp.json)
- **Filesystem MCP**: File operations (from mcp.json)

*Note: The Weather MCP provides real weather data from the National Weather Service. Other servers require HTTP bridges or are mocked.*

## 🎨 UI Improvements

✅ **Fixed Readability Issues**:
- Improved text contrast and font sizes
- Better color coding for different message types
- Enhanced button states and hover effects
- Responsive layout with proper spacing
- Clear visual status indicators

## 🔧 Technical Architecture

### Components
- **App.tsx**: Main application with React Flow canvas and chat interface
- **LLMNode.tsx**: Visual component for LLM nodes
- **MCPServerNode.tsx**: Visual component for MCP server nodes
- **services/mcpManager.ts**: Handles MCP server connections with weather tools
- **services/geminiClient.ts**: Google Gemini AI client with tool integration
- **services/mcpConfig.ts**: Dynamic configuration loader for MCP servers

### Key Features
- **Type Safety**: Full TypeScript implementation
- **CORS Enabled**: Configured for all origins
- **Mock MCP Integration**: Functional weather tools without external dependencies
- **Error Handling**: Graceful error handling for API and connection issues
- **Dynamic Loading**: Configuration loaded from external JSON file

## 🔄 Connection Flow

1. **Configuration Loading**: App loads MCP server configs from `mcp.json`
2. **Node Creation**: Dynamic generation of server nodes based on configuration
3. **Visual Connection**: Drag from LLM to MCP server node
4. **MCP Integration**: Establishes connection and loads available tools
5. **Gemini Enhancement**: LLM gains access to connected MCP tools
6. **Interactive Chat**: Use enhanced LLM with tool capabilities

## 🌟 What's Working

✅ **Dynamic Configuration Loading**: Reads from mcp.json automatically  
✅ **Visual Node Connections**: Smooth drag-and-drop interface  
✅ **Real Weather Data**: Live NWS API integration with current conditions, forecasts, and alerts  
✅ **Gemini Integration**: API key input and enhanced LLM chat with tool calling  
✅ **Improved UI**: Fixed readability and contrast issues  
✅ **Error-free Operation**: No console errors or warnings  
✅ **Real-time Feedback**: Connection status and tool counting  

## 🔮 Extending the Application

### Adding Real MCP Servers
1. Set up HTTP bridge servers for stdio-based MCP servers
2. Update `mcpConfig.ts` server URL mapping
3. Add server-specific connection logic in `mcpManager.ts`

### Adding New Tools
1. Define tools in the MCP server configuration
2. Implement tool handlers in `mcpManager.ts`
3. Tools automatically become available to Gemini

## 🛠️ Environment

- **Framework**: React + TypeScript + Vite
- **Flow Library**: React Flow v11
- **AI**: Google Generative AI (Gemini 1.5 Flash)
- **MCP**: Model Context Protocol SDK
- **Port**: 3000 (configurable in vite.config.ts)

## 💡 Usage Tips

- **API Key**: Required for Gemini functionality - enter in top-left input
- **Connection**: Drag from blue dot to orange dot to connect nodes
- **Status**: Watch for green nodes (connected) vs orange (disconnected)
- **Weather Queries**: Ask for weather in US cities, coordinates, or state alerts
- **Format**: Use "City, State" format for best results (e.g., "Miami, FL")
- **Tools**: Connected tool count shows in the status panel

---

**🎉 Ready to use!** The simplified MCP client now provides **real weather data** from the National Weather Service, enhanced UI, and dynamic configuration loading. Connect the nodes and start chatting with an AI that has access to live weather information for any US location!
