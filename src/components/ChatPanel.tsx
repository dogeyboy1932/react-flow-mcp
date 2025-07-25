import { useCallback, useState } from "react";
import { geminiClient } from "../geminiClient/geminiClient";


export default function ChatSection({ addChatMessage, chatHistory }: { addChatMessage: (message: string) => void, chatHistory: string[] }) {
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
      if (!chatMessage.trim() || isLoading) return;
  
      setIsLoading(true);
      const userMessage = chatMessage;
      setChatMessage('');
  
      try {
        addChatMessage(`You: ${userMessage}`);
        const response = await geminiClient.chat(userMessage);
        addChatMessage(`Gemini: ${response}`);
      } catch (error) {
        addChatMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          addChatMessage('🔑 API Key set');
      }
  };

  return (
      <div style={{ 
          width: '600px',  // Fixed width instead of percentage
          minWidth: '300px',  // Minimum width
          maxWidth: '600px',  // Maximum width
          height: '100vh', 
          padding: '20px', 
          backgroundColor: '#2d2d2d', 
          borderLeft: '1px solid #444',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
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
              borderRadius: '8px',
              flexShrink: 0  // Prevent shrinking
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
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0066aa'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007acc'}
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
              borderRadius: '8px',
              flexShrink: 0  // Prevent shrinking
          }}>
              <h4 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '16px',
                  color: '#4ade80'
              }}>
                  🔧 Available Tools: {geminiClient.getTools().length}
              </h4>
              
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
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
          </div>
          
          {/* Chat History */}
          <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              backgroundColor: '#3d3d3d',
              borderRadius: '8px',
              marginBottom: '15px',
              padding: '15px',
              minHeight: '200px'  // Minimum height for chat history
          }}>
              {chatHistory.length === 0 ? (
                  <div style={{ 
                      color: '#888',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      marginTop: '20px'
                  }}>
                      No messages yet. Start a conversation!
                  </div>
              ) : (
                  chatHistory.map((msg, index) => (
                      <div key={index} style={{ 
                          marginBottom: '10px',
                          padding: '10px',
                          borderRadius: '6px',
                          backgroundColor: msg.startsWith('You:') ? '#4a5568' : msg.startsWith('Error:') ? '#742a2a' : '#2d3748',
                          fontSize: '14px',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word'
                      }}>
                          {msg}
                      </div>
                  ))
              )}
              
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
          <div style={{ 
              display: 'flex', 
              gap: '10px',
              flexShrink: 0  // Prevent shrinking
          }}>
              <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about weather, GitHub repos, users, or anything else..."
                  style={{ 
                      flex: 1, 
                      padding: '12px', 
                      minHeight: '50px',
                      maxHeight: '120px',  // Increased max height
                      resize: 'vertical',
                      border: '1px solid #555',
                      borderRadius: '6px',
                      backgroundColor: '#4a4a4a',
                      color: '#fff',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
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
                      cursor: isLoading || !chatMessage.trim() ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                      flexShrink: 0
                  }}
                  onMouseOver={(e) => {
                      if (!isLoading && chatMessage.trim()) {
                          e.currentTarget.style.backgroundColor = '#0066aa';
                      }
                  }}
                  onMouseOut={(e) => {
                      if (!isLoading && chatMessage.trim()) {
                          e.currentTarget.style.backgroundColor = '#007acc';
                      }
                  }}
              >
                  {isLoading ? '...' : 'Send'}
              </button>
          </div>
      </div>
  );
}