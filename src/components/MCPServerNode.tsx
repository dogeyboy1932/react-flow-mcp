import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

interface MCPServerNodeData {
  label: string;
  serverType: string;
  url: string;
}

const MCPServerNode: React.FC<NodeProps<MCPServerNodeData>> = ({ data }) => {
  const [isConnected, setIsConnected] = useState(false);
  
  return (
    <div style={{
      background: isConnected ? '#e8f5e8' : '#fff3e0',
      border: `2px solid ${isConnected ? '#4caf50' : '#ff9800'}`,
      borderRadius: '10px',
      padding: '15px',
      minWidth: '150px',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
      color: isConnected ? '#4caf50' : '#ff9800'
    }}>
      <div>🔧 {data.label}</div>
      <div style={{ fontSize: '12px', marginTop: '5px', fontWeight: 'normal' }}>
        {data.serverType} MCP
      </div>
      <div style={{ 
        fontSize: '10px', 
        marginTop: '3px', 
        fontWeight: 'normal',
        color: '#666'
      }}>
        {data.url}
      </div>
      <div style={{ 
        fontSize: '10px', 
        marginTop: '5px',
        color: isConnected ? '#4caf50' : '#ff9800'
      }}>
        {isConnected ? '● Connected' : '○ Disconnected'}
      </div>
      
      {/* Input handle to receive connections from LLM */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: isConnected ? '#4caf50' : '#ff9800',
          width: '12px',
          height: '12px'
        }}
      />
    </div>
  );
};

export default memo(MCPServerNode); 