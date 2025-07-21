Setup:

Run the below commands
```
bun install
bun dev
```
(you could also use other package managers like npm)


Usage:
There are 4 built-in MCP servers [Weather, Github, Math, and Users] They should appear as nodes on the UI.

They are fairly simple. In order to add a node designated to your own custom github server, follow these steps:
1. Create your MCP server in the src/mcpServers folder. Make sure there is a function called createMCPServer that returns the server [use the built-in MCPs structure for reference]

2. Add your MCP server to the mcp_config.js. You should then be able to see your server node on the frontend (make sure you set the node coordinates so you can actually see your MCP node).

3. After you set your API key and connect the Gemini LLM node to your MCP server node on the frontend, you should be set!



Notes:
- Used mcp-b transports to allow mcps to be identifiable on the browser :)
- Used bun cuz it's supposedly faster


Next Steps / Improvements to be made:
1. could you create your own mcp server from the UI itself? (Code would need to be copied and pasted?)
I feel this functionality has been issued by no-code platforms like n8n...need to find a novelty in this

2. Need more modularity

3. Make chat a context...

4. Get users from database and not local storage

* MCP Servers must be client compatible (cant use node/promises). At least it doesn't work in this tab transport.
