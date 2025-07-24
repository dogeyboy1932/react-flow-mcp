import { useCallback, useEffect, useState } from 'react';
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

import ChatSection from './components/ChatPanel';

import LLMNode from './components/nodes/LLMNode';
import MCPServerNode from './components/nodes/MCPServerNode';

import { geminiClient } from './geminiClient/geminiClient';

import { MCP_SERVERS } from './mcpServers/_mcp_config';

import { useLoggerStore } from '../archive/logger/store-logger.ts';



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
    connected: false,
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

  // const [chatHistory, setChatHistory] = useState<string[]>([
  //   '🎉 Ready! Connect the LLM to any MCP server to start.'
  // ]);
  
  // const { log, logs } = useLoggerStore();


  // // CHAT HISTORY
  // const addChatMessage = useCallback((message: string) => {
  //     setChatHistory(prev => [...prev, message]);
  // }, []);

  // useEffect(() => {
  //   console.log(logs);

  //   logs.forEach((log) => {
  //     if (typeof log.message === "string") {
  //       addChatMessage(log.message);
  //     }
  //   });
  // }, [logs, log]);

  // useEffect(() => {
  //   client.on("log", log);
  //   return () => {
  //     client.off("log", log);
  //   };
  // }, [client, log]);



  // NODES
  const updateNode = useCallback((nodeId: string, description: string, isConnected: boolean) => {
    setNodes(nodes => nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, description, connected: isConnected } }
        : node
    ));
  }, [setNodes]);

  // const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
  //   for (const edge of edgesToDelete) {
  //     if (edge.source === LLM_NODE_ID && isMCPServer(edge.target)) {
  //       await geminiClient.disconnect();
  //       const serverName = getServerName(edge.target);
  //       addChatMessage(`🔌 Disconnected from ${serverName}`);
  //       updateNode(edge.target, `${serverName} - Not connected`, false);
  //     }
  //   }
  // }, [addChatMessage, updateNode]);



  // CONNECTIONS
  const connectToMCP = useCallback(async (targetId: string) => {
    console.log(`🔗 Connecting to ${targetId}...`);
    
    const success = await geminiClient.mcpConnect(targetId);
    const toolCount = geminiClient.getTools().length;
    const serverName = getServerName(targetId);
    
    if (success) {
      // addChatMessage(`🔗 Connected to ${serverName} (${toolCount} tools)`);
      updateNode(targetId, `${serverName} - ${toolCount} tools`, true);
    } else {
      // addChatMessage(`⚠️ Failed to connect to ${serverName}`);
    }
  }, [
    // addChatMessage, 
    updateNode]);


  const disconnectExistingMCP = useCallback(async () => {
    const mcpEdges = edges.filter(edge => 
      edge.source === LLM_NODE_ID && isMCPServer(edge.target)
    );
    
    if (mcpEdges.length > 0) {
      console.log('🔌 Auto-disconnecting previous MCP connection...');
      await geminiClient.mcpDisconnect();
      
      // Remove existing MCP edges
      setEdges(eds => eds.filter(edge => 
        !(edge.source === LLM_NODE_ID && isMCPServer(edge.target))
      ));
      
      // Reset node descriptions
      mcpEdges.forEach(edge => {
        const serverName = getServerName(edge.target);
        updateNode(edge.target, `${serverName} - Not connected`, false);
      });
      
      // addChatMessage('🔌 Auto-disconnected previous server to connect to new one');
    }
  }, [edges, setEdges, updateNode,
    //  addChatMessage
    ]);


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


  useEffect(() => {
    localStorage.clear();
  }, []);


  return (
    <div 
    style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden'
    }}
    >
      
      
    
      <div style={{ 
        width: '100%',       // Fixed width
        height: '100%',      // Fixed height  
        // margin: '20px auto',  // Center it
        border: '1px solid #333', // So you can see the boundary
        overflow: 'hidden'
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }}
          elementsSelectable={true}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
        >
          <Background color="#333" />
          <Controls />
        </ReactFlow>

        

      </div>

      {/* Chat Section */}
      <ChatSection 
        // addChatMessage={addChatMessage} chatHistory={chatHistory} 
      />      

    </div>
  );
}

export default App;

