import { useCallback, useState } from 'react';
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

import ChatSection from './components/ChatBar';

import LLMNode from './components/nodes/LLMNode';
import MCPServerNode from './components/nodes/MCPServerNode';

import { geminiClient } from './geminiClient/geminiClient';
import './App.css';

import { MCP_SERVERS } from './mcp_config';



const LLM_NODE_ID = 'llm-1';

const nodeTypes: NodeTypes = {
  llm: LLMNode,
  mcpServer: MCPServerNode,
};


// Helper functions
const createMCPServerNode = (id: string, config: typeof MCP_SERVERS[keyof typeof MCP_SERVERS]): Node => ({
  id,
  type: 'mcpServer',
  position: config.position,
  data: {
    label: config.label,
    serverType: id,
    url: config.url,
    description: `${config.label} - Not connected`,
  },
});

const isMCPServer = (nodeId: string | null): nodeId is keyof typeof MCP_SERVERS => {
  if (!nodeId) return false;
  
  return nodeId in MCP_SERVERS;
};


const getServerName = (serverId: string): string => {
  return isMCPServer(serverId) ? MCP_SERVERS[serverId].label : serverId;
};


const initialNodes: Node[] = [
  {
    id: LLM_NODE_ID,
    type: 'llm',
    position: { x: 100, y: 150 },
    data: { label: 'Gemini LLM' },
  },
  ...Object.entries(MCP_SERVERS).map(([id, config]) => createMCPServerNode(id, config)),
];



function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [chatHistory, setChatHistory] = useState<string[]>([
    '🎉 Ready! Connect the LLM to any MCP server to start.'
  ]);
  

  // CHAT HISTORY
  const addChatMessage = useCallback((message: string) => {
      setChatHistory(prev => [...prev, message]);
  }, []);



  // NODES
  const updateNodeDescription = useCallback((nodeId: string, description: string) => {
    setNodes(nodes => nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, description } }
        : node
    ));
  }, [setNodes]);

  const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
    for (const edge of edgesToDelete) {
      if (edge.source === LLM_NODE_ID && isMCPServer(edge.target)) {
        await geminiClient.disconnect();
        const serverName = getServerName(edge.target);
        addChatMessage(`🔌 Disconnected from ${serverName}`);
        updateNodeDescription(edge.target, `${serverName} - Not connected`);
      }
    }
  }, [addChatMessage, updateNodeDescription]);



  // CONNECTIONS
  const connectToMCP = useCallback(async (targetId: string) => {
    console.log(`🔗 Connecting to ${targetId}...`);
    
    const success = await geminiClient.connect(targetId);
    const toolCount = geminiClient.getTools().length;
    const serverName = getServerName(targetId);
    
    if (success) {
      addChatMessage(`🔗 Connected to ${serverName} (${toolCount} tools)`);
      updateNodeDescription(targetId, `${serverName} - ${toolCount} tools`);
    } else {
      addChatMessage(`⚠️ Failed to connect to ${serverName}`);
    }
  }, [addChatMessage, updateNodeDescription]);


  const disconnectExistingMCP = useCallback(async () => {
    const mcpEdges = edges.filter(edge => 
      edge.source === LLM_NODE_ID && isMCPServer(edge.target)
    );
    
    if (mcpEdges.length > 0) {
      console.log('🔌 Auto-disconnecting previous MCP connection...');
      await geminiClient.disconnect();
      
      // Remove existing MCP edges
      setEdges(eds => eds.filter(edge => 
        !(edge.source === LLM_NODE_ID && isMCPServer(edge.target))
      ));
      
      // Reset node descriptions
      mcpEdges.forEach(edge => {
        const serverName = getServerName(edge.target);
        updateNodeDescription(edge.target, `${serverName} - Not connected`);
      });
      
      addChatMessage('🔌 Auto-disconnected previous server to connect to new one');
    }
  }, [edges, setEdges, updateNodeDescription, addChatMessage]);


  const onConnect = useCallback(async (params: Connection) => {
    if (params.source === LLM_NODE_ID && isMCPServer(params.target)) {
      await disconnectExistingMCP();

      setEdges((eds) => addEdge(params, eds));
      
      await connectToMCP(params.target);
    } else {
      // For non-MCP connections, just add the edge normally
      setEdges((eds) => addEdge(params, eds));
    }
  }, [setEdges, disconnectExistingMCP, connectToMCP]);



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
      <div style={{ width: '100%', height: '100%' }}>
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
      <ChatSection addChatMessage={addChatMessage} chatHistory={chatHistory} />

    </div>
  );
}

export default App;