// import { useEffect, useRef, useState } from "react";
import { geminiClient } from "../geminiClient/geminiClient";


// /**
//  * Copyright 2024 Google LLC
//  * Licensed under the Apache License, Version 2.0
//  */
// import cn from "classnames";
// import { useEffect, useRef, useState } from "react";
// import { useLiveAPIContext } from "./contexts/LiveAPIContext";

// Types
// import type { QueryResult, CommandHistoryEntry, ToolResponse } from '../voice-stuff/types/tool-types';
// import type { ToolCall } from "../voice-stuff/types/multimodal-live-types";

// Components
// import SidePanel from "../voice-stuff/components/side-panel/SidePanel";
// import ControlTray from "../voice-stuff/components/control-tray/ControlTray";
// import { Alert, AlertDescription } from '../voice-stuff/components/alert/alert';
// import { AlertCircle } from 'lucide-react';

// Tools and Components
// import { DatabaseQuery, handleDatabaseQuery } from '../voice-stuff/tools/database-tool';
// import { ShellTool, handleShellCommand } from '../voice-stuff/tools/shell-executor-tool';
// import { GraphingTool } from "../voice-stuff/tools/altair-tool";

import { LLM_CONFIG } from "../voice-stuff/config/llmConfig";

// Styles
// import "../voice-stuff/App.scss";
import { useLiveAPIContext } from "../contexts/LiveAPIContext";

import cn from "classnames";
// import { useLoggerStore } from "../voice-stuff/components/logger/store-logger";


import { memo, type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { 
  Mic, 
  MicOff, 
  // Video, 
  // VideoOff, 
  // Monitor, 
  // MonitorX, 
  Play, 
  Pause,
  Send
} from "lucide-react";
// import type { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
// import { useScreenCapture } from "../../hooks/use-screen-capture";
// import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../voice-stuff/lib/audio-recorder.ts";
import AudioPulse from "../voice-stuff/components/audio-pulse/AudioPulse";
import "../voice-stuff/styles/control-tray.scss";
// import { useLoggerStore } from "../voice-stuff/components/logger/store-logger";

import { useLoggerStore } from "../../archive/logger/store-logger.ts";
import type { StreamingLog } from "../voice-stuff/types/multimodal-live-types.ts";

import Logger, { component } from "../../archive/logger/Logger.tsx";






export default function ChatSection(
    // { addChatMessage, chatHistory }: { addChatMessage: (message: string) => void, chatHistory: string[] }
) {
    const [chatMessage, setChatMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // const { client, setConfig } = useLiveAPIContext();

    const videoRef = useRef<HTMLVideoElement>(null);
    const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
    // const [webcam, screenCapture] = videoStreams;
    const [inVolume, setInVolume] = useState(0);
    const [audioRecorder] = useState(() => new AudioRecorder());
    const [muted, setMuted] = useState(false);
    const renderCanvasRef = useRef<HTMLCanvasElement>(null);
    const connectButtonRef = useRef<HTMLButtonElement>(null);
    // const [geminiApiKey, setGeminiApiKey] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    // const [transcribedText, setTranscribedText] = useState('');control-tray

    const [chatHistory, setChatHistory] = useState<string[]>([
        '🎉 Ready! Connect the LLM to any MCP server to start.'
    ]);

    const { client, connected, connect, disconnect, volume, setConfig } = useLiveAPIContext();
    
    const { log, logs, clearLogs } = useLoggerStore();


    // CHAT HISTORY
    const addChatMessage = useCallback((message: string) => {
        setChatHistory(prev => [...prev, message]);
    }, []);

    useEffect(() => {
        if (logs.length === 0) return;
        
        console.log(logs);

        logs.forEach((log) => {
        if (typeof log.message === "string") {
            addChatMessage(log.message);
        }
        });

        clearLogs();
    }, [logs]);



    useEffect(() => {
        client.on("log", log);
        return () => {
        client.off("log", log);
        };
    }, [client, log]);




// const LogEntry = ({
//     log,
//     MessageComponent,
//   }: {
//     log: StreamingLog;
//     MessageComponent: ({
//       message,
//     }: {
//       message: StreamingLog["message"];
//     }) => ReactNode;
//   }): JSX.Element => (
//     <li
//       className={cn(
//         `plain-log`,
//         `source-${log.type.slice(0, log.type.indexOf("."))}`,
//         {
//           receive: log.type.includes("receive"),
//           send: log.type.includes("send"),
//         },
//       )}
//     >
//       <span className="timestamp">{formatTime(log.date)}</span>
//       <span className="source">{log.type}</span>
//       <span className="message">
//         <MessageComponent message={log.message} />
//       </span>
//       {log.count && <span className="count">{log.count}</span>}
//     </li>
//   );



useEffect(() => {
    const onData = (base64: string) => {
      // if (isTranscribing) {
      //   // This is where you would send the audio data to a speech-to-text service
      //   // For this example, we'll just simulate it by appending " " to the transcribed text
      //   setTranscribedText(prev => prev + " ");
      // }
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };

    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }

    return () => {
      console.log("CLOSE")
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };


  }, [connected, client, muted, audioRecorder, isTranscribing]);



  


//   const { log, logs } = useLoggerStore();
  
  // LLM Configuration  ***
  useEffect(() => {
    setConfig(LLM_CONFIG);
  }, [setConfig]);

  const handleSendMessage = async () => {
      if (!chatMessage.trim() || isLoading) return;
  
      setIsLoading(true);
      const userMessage = chatMessage;
      setChatMessage('');
  
      try {
        addChatMessage(`You: ${userMessage}`);
        // const response = await geminiClient.chat(userMessage);
        // addChatMessage(`Gemini: ${response}`);

        client.send([{
            text: userMessage,
        }]);
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

              {/* <Logger
                // filter="conversations"
              /> */}
              
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
          {/* Chat Input */}
          <div style={{ 
              display: 'flex', 
              gap: '10px',
              flexShrink: 0  // Prevent shrinking
          }}>
              <nav className={cn("actions-nav", { disabled: !connected })}>
                <button
                className={cn("action-button mic-button", { muted })}
                onClick={() => setMuted(!muted)}
                title={muted ? "Unmute microphone" : "Mute microphone"}
                >
                {!muted ? (
                    <Mic className="lucide-icon" />
                ) : (
                    <MicOff className="lucide-icon" />
                )}
                </button>

                <div className="action-button no-action outlined">
                <AudioPulse volume={volume} active={connected} hover={false} />
                </div>
            
            
            
            </nav>
            
            <button className={cn("connection-container", { connected })}
                ref={connectButtonRef}
                onClick={connected ? disconnect : connect}
                title={connected ? "Disconnect" : "Connect"}
            >
                <div className="connection-button-container">
                    {connected ? (
                        <Pause className="lucide-icon" />
                    ) : (
                        <Play className="lucide-icon" />
                    )}
                </div>

                <span className="text-indicator">
                    {connected ? "Connected" : "Disconnected"}
                </span>
            </button>
              
          </div>
          {/* <ControlTray
                videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                // supportsVideo={true}
                // onVideoStreamChange={setVideoStream}
            /> */}
          {/* <div className="main-app-area"> */}
            {/* Video Stream */}
            {/* <video
                className={cn("stream", {
                hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
            /> */}
              
        {/* </div> */}
        </div>
  );
}