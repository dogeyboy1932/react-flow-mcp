import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import LLMNode from './components/LLMNode';
import MCPServerNode from './components/MCPServerNode';
import { geminiClient } from './geminiClient/geminiClient';
import './App.css';

const nodeTypes: NodeTypes = {
  llm: LLMNode,
  mcpServer: MCPServerNode,
};

const initialNodes: Node[] = [
  {
    id: 'llm-1',
    type: 'llm',
    position: { x: 100, y: 150 },
    data: { label: 'Gemini LLM' },
  },
  {
    id: 'weather-mcp',
    type: 'mcpServer',
    position: { x: 400, y: 50 },
    data: {
      label: 'Weather MCP',
      serverType: 'weather-mcp',  
      url: 'mcp://weather-mcp',
      description: 'Weather MCP - Not connected'
    },
  },
  {
    id: 'github-mcp',
    type: 'mcpServer',
    position: { x: 400, y: 200 },
    data: {
      label: 'GitHub MCP',
      serverType: 'github-mcp',
      url: 'mcp://github-mcp',
      description: 'GitHub MCP - Not connected'
    },
  }
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<string[]>([
    '🎉 Ready! Connect the LLM to Weather or GitHub MCP servers to start.'
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const onConnect = useCallback(async (params: Connection) => {
    if (params.source === 'llm-1' && (params.target === 'weather-mcp' || params.target === 'github-mcp')) {
      // First, disconnect any existing connections and remove those edges
      const currentEdges = edges.filter(edge => 
        edge.source === 'llm-1' && (edge.target === 'weather-mcp' || edge.target === 'github-mcp')
      );
      
             if (currentEdges.length > 0) {
         console.log('🔌 Auto-disconnecting previous MCP connection...');
         await geminiClient.disconnect();
         
         // Remove existing MCP edges and reset node descriptions
         setEdges(eds => eds.filter(edge => 
           !(edge.source === 'llm-1' && (edge.target === 'weather-mcp' || edge.target === 'github-mcp'))
         ));
         
         setNodes(nodes => nodes.map(node => {
           if (node.id === 'weather-mcp' || node.id === 'github-mcp') {
             const serverName = node.id === 'weather-mcp' ? 'Weather MCP' : 'GitHub MCP';
             return { ...node, data: { ...node.data, description: `${serverName} - Not connected` } };
           }
           return node;
         }));
         
         setChatHistory(prev => [...prev, '🔌 Auto-disconnected previous server to connect to new one']);
       }
      
      // Add the new edge
      setEdges((eds) => addEdge(params, eds));
      
      console.log(`🔗 Connecting to ${params.target}...`);
      
      const success = await geminiClient.connect(params.target);
      const toolCount = geminiClient.getTools().length;
      
      if (success) {
        const serverName = params.target === 'weather-mcp' ? 'Weather MCP' : 'GitHub MCP';
        setChatHistory(prev => [...prev, `🔗 Connected to ${serverName} (${toolCount} tools)`]);
        setNodes(nodes => nodes.map(node => 
          node.id === params.target 
            ? { ...node, data: { ...node.data, description: `${serverName} - ${toolCount} tools` } }
            : node
        ));
      } else {
        const serverName = params.target === 'weather-mcp' ? 'Weather MCP' : 'GitHub MCP';
        setChatHistory(prev => [...prev, `⚠️ Failed to connect to ${serverName}`]);
      }
    } else {
      // For non-MCP connections, just add the edge normally
      setEdges((eds) => addEdge(params, eds));
    }
  }, [setEdges, setNodes, edges]);

  const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
    for (const edge of edgesToDelete) {
      if (edge.source === 'llm-1' && (edge.target === 'weather-mcp' || edge.target === 'github-mcp')) {
        await geminiClient.disconnect();
        const serverName = edge.target === 'weather-mcp' ? 'Weather MCP' : 'GitHub MCP';
        setChatHistory(prev => [...prev, `🔌 Disconnected from ${serverName}`]);
        setNodes(nodes => nodes.map(node => 
          node.id === edge.target 
            ? { ...node, data: { ...node.data, description: `${serverName} - Not connected` } }
            : node
        ));
      }
    }
  }, [setNodes]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = chatMessage;
    setChatMessage('');

    try {
      setChatHistory(prev => [...prev, `You: ${userMessage}`]);
      const response = await geminiClient.chat(userMessage);
      setChatHistory(prev => [...prev, `Gemini: ${response}`]);
    } catch (error) {
      setChatHistory(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const apiKey = formData.get('apiKey') as string;
    
    if (apiKey) {
      geminiClient.setApiKey(apiKey);
      setChatHistory(prev => [...prev, '🔑 API Key set']);
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* React Flow Section */}
      <div style={{ width: '70%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          style={{ backgroundColor: '#1a1a1a' }}
        >
          <Background color="#333" />
          <Controls />
        </ReactFlow>
      </div>

      {/* Chat Section */}
      <div style={{ 
        width: '30%', 
        height: '100%', 
        padding: '20px', 
        backgroundColor: '#2d2d2d', 
        borderLeft: '1px solid #444',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <h2 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '20px',
          color: '#fff'
        }}>
          🤖 Gemini Chat
        </h2>
        
        {/* API Key Form */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#3d3d3d', 
          borderRadius: '8px'
        }}>
          <form onSubmit={handleApiKeySubmit}>
            <input 
              name="apiKey" 
              type="password" 
              placeholder="Enter Gemini API Key"
              style={{ 
                width: '100%', 
                padding: '10px', 
                marginBottom: '10px',
                border: '1px solid #555',
                borderRadius: '4px',
                backgroundColor: '#4a4a4a',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <button 
              type="submit" 
              style={{ 
                width: '100%', 
                padding: '10px',
                backgroundColor: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Set API Key
            </button>
          </form>
        </div>

        {/* Tools Info */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#0d4f3c', 
          borderRadius: '8px'
        }}>
          <h4 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '16px',
            color: '#4ade80'
          }}>
            🔧 Available Tools: {geminiClient.getTools().length}
          </h4>
          
          {geminiClient.getTools().map((tool: any) => (
            <div key={tool.name} style={{ 
              fontSize: '12px',
              color: '#a0a0a0',
              marginBottom: '4px',
              fontFamily: 'monospace'
            }}>
              • {tool.name}
            </div>
          ))}
        </div>
        
        {/* Chat History */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          backgroundColor: '#3d3d3d',
          borderRadius: '8px',
          marginBottom: '15px',
          padding: '15px'
        }}>
          {chatHistory.map((msg, index) => (
            <div key={index} style={{ 
              marginBottom: '10px',
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: msg.startsWith('You:') ? '#4a5568' : '#2d3748',
              fontSize: '14px',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap'
            }}>
              {msg}
            </div>
          ))}
          
          {isLoading && (
            <div style={{ 
              padding: '10px',
              textAlign: 'center',
              color: '#a0a0a0',
              fontStyle: 'italic'
            }}>
              🤔 Thinking...
            </div>
          )}
        </div>
        
        {/* Chat Input */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about weather, GitHub repos, or anything else..."
            style={{ 
              flex: 1, 
              padding: '12px', 
              minHeight: '50px',
              maxHeight: '100px',
              resize: 'vertical',
              border: '1px solid #555',
              borderRadius: '6px',
              backgroundColor: '#4a4a4a',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !chatMessage.trim()}
            style={{ 
              padding: '12px 20px', 
              minHeight: '50px',
              backgroundColor: isLoading || !chatMessage.trim() ? '#555' : '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isLoading || !chatMessage.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
