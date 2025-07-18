#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

class WeatherServer {
  constructor() {
    this.server = new Server(
      {
        name: 'weather-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_current_weather',
            description: 'Get the current weather for a specific location',
            inputSchema: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state/country, e.g. "San Francisco, CA" or "London, UK"',
                },
                units: {
                  type: 'string',
                  description: 'Temperature units (celsius, fahrenheit, or kelvin)',
                  enum: ['celsius', 'fahrenheit', 'kelvin'],
                  default: 'celsius',
                },
              },
              required: ['location'],
            },
          },
          {
            name: 'get_weather_forecast',
            description: 'Get a 5-day weather forecast for a specific location',
            inputSchema: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state/country, e.g. "San Francisco, CA" or "London, UK"',
                },
                units: {
                  type: 'string',
                  description: 'Temperature units (celsius, fahrenheit, or kelvin)',
                  enum: ['celsius', 'fahrenheit', 'kelvin'],
                  default: 'celsius',
                },
              },
              required: ['location'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'get_current_weather') {
          const result = await this.getCurrentWeather(args.location, args.units);
          return result;
        } else if (name === 'get_weather_forecast') {
          const result = await this.getWeatherForecast(args.location, args.units);
          return result;
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Weather API error: ${error.message}`
        );
      }
    });
  }

  async getCurrentWeather(location, units = 'celsius') {
    try {
      const weatherData = await this.fetchWeatherData(location, units);
      
      return {
        content: [
          {
            type: 'text',
            text: `Current weather in ${location}:
Temperature: ${weatherData.temperature}°${this.getUnitSymbol(units)}
Condition: ${weatherData.condition}
Humidity: ${weatherData.humidity}%
Wind Speed: ${weatherData.windSpeed} km/h
Feels like: ${weatherData.feelsLike}°${this.getUnitSymbol(units)}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get current weather: ${error.message}`
      );
    }
  }

  async getWeatherForecast(location, units = 'celsius') {
    try {
      const forecastData = await this.fetchForecastData(location, units);
      
      const forecastText = forecastData.map(day => 
        `${day.date}: ${day.condition}, High: ${day.high}°${this.getUnitSymbol(units)}, Low: ${day.low}°${this.getUnitSymbol(units)}`
      ).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `5-day weather forecast for ${location}:\n\n${forecastText}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get weather forecast: ${error.message}`
      );
    }
  }

  // Mock weather data - replace with real API calls
  async fetchWeatherData(location, units) {
    // For demo, return mock data
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    const baseTemp = Math.floor(Math.random() * 30) + 5; // Random temp between 5-35°C
    const temperature = this.convertTemperature(baseTemp, 'celsius', units);
    const feelsLike = this.convertTemperature(baseTemp + Math.floor(Math.random() * 6) - 3, 'celsius', units);
    
    const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Overcast'];
    
    return {
      temperature: Math.round(temperature),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.floor(Math.random() * 40) + 30, // 30-70%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      feelsLike: Math.round(feelsLike),
    };
  }

  async fetchForecastData(location, units) {
    // Mock 5-day forecast data
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate API delay
    
    const forecast = [];
    const today = new Date();
    
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const baseHigh = Math.floor(Math.random() * 25) + 10; // 10-35°C
      const baseLow = baseHigh - Math.floor(Math.random() * 10) - 5; // 5-15°C lower
      
      const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Overcast', 'Thunderstorms'];
      
      forecast.push({
        date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        high: Math.round(this.convertTemperature(baseHigh, 'celsius', units)),
        low: Math.round(this.convertTemperature(baseLow, 'celsius', units)),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
      });
    }
    
    return forecast;
  }

  convertTemperature(temp, fromUnit, toUnit) {
    if (fromUnit === toUnit) return temp;
    
    // Convert to Celsius first
    let celsius = temp;
    if (fromUnit === 'fahrenheit') {
      celsius = (temp - 32) * 5/9;
    } else if (fromUnit === 'kelvin') {
      celsius = temp - 273.15;
    }
    
    // Convert from Celsius to target unit
    if (toUnit === 'fahrenheit') {
      return celsius * 9/5 + 32;
    } else if (toUnit === 'kelvin') {
      return celsius + 273.15;
    }
    
    return celsius;
  }

  getUnitSymbol(units) {
    switch (units) {
      case 'fahrenheit': return 'F';
      case 'kelvin': return 'K';
      default: return 'C';
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Weather MCP server running on stdio');
  }
}

const server = new WeatherServer();
server.run().catch(console.error); 