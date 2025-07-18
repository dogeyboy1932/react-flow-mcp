import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createServer } from 'http';

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

// Define Zod schemas for validation
const AlertsArgumentsSchema = z.object({
  state: z.string().length(2),
});

const ForecastArgumentsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const CurrentWeatherArgumentsSchema = z.object({
  location: z.string().min(1),
});

// Create server instance
const server = new Server(
  {
    name: "weather",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function for geocoding
async function getCoordinatesForCity(location) {
  try {
    const encodedLocation = encodeURIComponent(location + ', USA');
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get-alerts",
        description: "Get weather alerts for a state",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "Two-letter state code (e.g. CA, NY)",
            },
          },
          required: ["state"],
        },
      },
      {
        name: "get-forecast",
        description: "Get weather forecast for a location",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude of the location",
            },
            longitude: {
              type: "number",
              description: "Longitude of the location",
            },
          },
          required: ["latitude", "longitude"],
        },
      },
      {
        name: "get-current-weather",
        description: "Get current weather for a US city (will convert city to coordinates)",
        inputSchema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "US city and state, e.g. 'San Francisco, CA' or 'New York, NY'",
            },
          },
          required: ["location"],
        },
      },
    ],
  };
});

// Helper function for making NWS API requests
async function makeNWSRequest(url) {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  }
}

// Format alert data
function formatAlert(feature) {
  const props = feature.properties;
  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "No headline"}`,
    "---",
  ].join("\n");
}

// Tool functions extracted for reuse
async function getWeatherAlerts(state) {
  const stateCode = state.toUpperCase();

  const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
  const alertsData = await makeNWSRequest(alertsUrl);

  if (!alertsData) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to retrieve alerts data",
        },
      ],
    };
  }

  const features = alertsData.features || [];
  if (features.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No active alerts for ${stateCode}`,
        },
      ],
    };
  }

  const formattedAlerts = features.map(formatAlert);
  const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join(
    "\n"
  )}`;

  return {
    content: [
      {
        type: "text",
        text: alertsText,
      },
    ],
  };
}

async function getWeatherForecast(latitude, longitude) {
  // Get grid point data
  const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(
    4
  )},${longitude.toFixed(4)}`;
  const pointsData = await makeNWSRequest(pointsUrl);

  if (!pointsData) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
        },
      ],
    };
  }

  const forecastUrl = pointsData.properties?.forecast;
  if (!forecastUrl) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to get forecast URL from grid point data",
        },
      ],
    };
  }

  // Get forecast data
  const forecastData = await makeNWSRequest(forecastUrl);
  if (!forecastData) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to retrieve forecast data",
        },
      ],
    };
  }

  const periods = forecastData.properties?.periods || [];
  if (periods.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No forecast periods available",
        },
      ],
    };
  }

  // Format forecast periods
  const formattedForecast = periods.map((period) =>
    [
      `${period.name || "Unknown"}:`,
      `Temperature: ${period.temperature || "Unknown"}°${
        period.temperatureUnit || "F"
      }`,
      `Wind: ${period.windSpeed || "Unknown"} ${
        period.windDirection || ""
      }`,
      `${period.shortForecast || "No forecast available"}`,
      "---",
    ].join("\n")
  );

  const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join(
    "\n"
  )}`;

  return {
    content: [
      {
        type: "text",
        text: forecastText,
      },
    ],
  };
}

async function getCurrentWeather(location) {
  // First, get coordinates for the location
  const coords = await getCoordinatesForCity(location);
  
  if (!coords) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Could not find coordinates for "${location}". Please try with a US city and state, e.g., "San Francisco, CA"`,
        },
      ],
    };
  }

  console.error(`📍 Found coordinates for ${location}: ${coords.lat}, ${coords.lon}`);

  // Get grid point data
  const pointsUrl = `${NWS_API_BASE}/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
  const pointsData = await makeNWSRequest(pointsUrl);

  if (!pointsData) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to retrieve grid point data for ${location}. This location may not be supported by the NWS API (only US locations are supported).`,
        },
      ],
    };
  }

  const forecastUrl = pointsData.properties?.forecast;
  if (!forecastUrl) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to get forecast URL from grid point data",
        },
      ],
    };
  }

  // Get forecast data
  const forecastData = await makeNWSRequest(forecastUrl);
  if (!forecastData) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to retrieve forecast data",
        },
      ],
    };
  }

  const periods = forecastData.properties?.periods || [];
  if (periods.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No forecast periods available",
        },
      ],
    };
  }

  // Get current conditions (first period)
  const currentPeriod = periods[0];
  
  const currentWeather = [
    `📍 Location: ${location}`,
    `🌍 Coordinates: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
    ``,
    `🌤️ ${currentPeriod.name || "Current"}:`,
    `🌡️ Temperature: ${currentPeriod.temperature || "Unknown"}°${currentPeriod.temperatureUnit || "F"}`,
    `💨 Wind: ${currentPeriod.windSpeed || "Unknown"} ${currentPeriod.windDirection || ""}`,
    `☁️ ${currentPeriod.shortForecast || "No forecast available"}`,
  ].join('\n');

  return {
    content: [
      {
        type: "text",
        text: `🌍 Current weather for ${location}:\n\n${currentWeather}`,
      },
    ],
  };
}

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get-alerts") {
      const { state } = AlertsArgumentsSchema.parse(args);
      const stateCode = state.toUpperCase();

      const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
      const alertsData = await makeNWSRequest(alertsUrl);

      if (!alertsData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve alerts data",
            },
          ],
        };
      }

      const features = alertsData.features || [];
      if (features.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No active alerts for ${stateCode}`,
            },
          ],
        };
      }

      const formattedAlerts = features.map(formatAlert);
      const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join(
        "\n"
      )}`;

      return {
        content: [
          {
            type: "text",
            text: alertsText,
          },
        ],
      };
    } else if (name === "get-forecast") {
      const { latitude, longitude } = ForecastArgumentsSchema.parse(args);

      // Get grid point data
      const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(
        4
      )},${longitude.toFixed(4)}`;
      const pointsData = await makeNWSRequest(pointsUrl);

      if (!pointsData) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
            },
          ],
        };
      }

      const forecastUrl = pointsData.properties?.forecast;
      if (!forecastUrl) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to get forecast URL from grid point data",
            },
          ],
        };
      }

      // Get forecast data
      const forecastData = await makeNWSRequest(forecastUrl);
      if (!forecastData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve forecast data",
            },
          ],
        };
      }

      const periods = forecastData.properties?.periods || [];
      if (periods.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No forecast periods available",
            },
          ],
        };
      }

      // Format forecast periods
      const formattedForecast = periods.map((period) =>
        [
          `${period.name || "Unknown"}:`,
          `Temperature: ${period.temperature || "Unknown"}°${
            period.temperatureUnit || "F"
          }`,
          `Wind: ${period.windSpeed || "Unknown"} ${
            period.windDirection || ""
          }`,
          `${period.shortForecast || "No forecast available"}`,
          "---",
        ].join("\n")
      );

      const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join(
        "\n"
      )}`;

      return {
        content: [
          {
            type: "text",
            text: forecastText,
          },
        ],
      };
    } else if (name === "get-current-weather") {
      const { location } = CurrentWeatherArgumentsSchema.parse(args);
      
      // First, get coordinates for the location
      const coords = await getCoordinatesForCity(location);
      
      if (!coords) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Could not find coordinates for "${location}". Please try with a US city and state, e.g., "San Francisco, CA"`,
            },
          ],
        };
      }

      console.error(`📍 Found coordinates for ${location}: ${coords.lat}, ${coords.lon}`);

      // Get grid point data
      const pointsUrl = `${NWS_API_BASE}/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
      const pointsData = await makeNWSRequest(pointsUrl);

      if (!pointsData) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve grid point data for ${location}. This location may not be supported by the NWS API (only US locations are supported).`,
            },
          ],
        };
      }

      const forecastUrl = pointsData.properties?.forecast;
      if (!forecastUrl) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to get forecast URL from grid point data",
            },
          ],
        };
      }

      // Get forecast data
      const forecastData = await makeNWSRequest(forecastUrl);
      if (!forecastData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve forecast data",
            },
          ],
        };
      }

      const periods = forecastData.properties?.periods || [];
      if (periods.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No forecast periods available",
            },
          ],
        };
      }

      // Get just the first period as "current" weather
      const currentPeriod = periods[0];
      const currentWeather = [
        `📍 Location: ${location}`,
        `🌍 Coordinates: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
        ``,
        `🌤️ ${currentPeriod.name || "Current"}:`,
        `🌡️ Temperature: ${currentPeriod.temperature || "Unknown"}°${currentPeriod.temperatureUnit || "F"}`,
        `💨 Wind: ${currentPeriod.windSpeed || "Unknown"} ${currentPeriod.windDirection || ""}`,
        `☁️ ${currentPeriod.shortForecast || "No forecast available"}`,
      ].join('\n');

      return {
        content: [
          {
            type: "text",
            text: `🌍 Current weather for ${location}:\n\n${currentWeather}`,
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
  console.error("Enhanced Weather MCP Server running on stdio");
}

// Add HTTP bridge for browser compatibility
function startHttpBridge() {
  const httpServer = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (req.method === 'POST' && req.url === '/call-tool') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { toolName, args } = JSON.parse(body);
          
          // Call the appropriate tool function directly
          let result;
          if (toolName === 'get-alerts') {
            const parsedArgs = AlertsArgumentsSchema.parse(args);
            result = await getWeatherAlerts(parsedArgs.state);
          } else if (toolName === 'get-forecast') {
            const parsedArgs = ForecastArgumentsSchema.parse(args);
            result = await getWeatherForecast(parsedArgs.latitude, parsedArgs.longitude);
          } else if (toolName === 'get-current-weather') {
            const parsedArgs = CurrentWeatherArgumentsSchema.parse(args);
            result = await getCurrentWeather(parsedArgs.location);
          } else {
            throw new Error(`Unknown tool: ${toolName}`);
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          console.error('HTTP Bridge Error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: error.message || 'Internal server error' 
          }));
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  httpServer.listen(3001, () => {
    console.error("HTTP bridge running on http://localhost:3001");
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

// Start HTTP bridge for browser compatibility
startHttpBridge(); 