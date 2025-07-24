import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import reportWebVitals from './reportWebVitals';

import './index.css'
import App from './App.tsx'

import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { API_CONFIG } from './voice-stuff/config/llmConfig';


// const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const API_KEY = "AIzaSyDc9aWrINGvdFHCLmiRRCudTdOhUPGhJHM";
if (!API_KEY) throw new Error("Missing REACT_APP_GEMINI_API_KEY in .env");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LiveAPIProvider url={API_CONFIG.uri} apiKey={API_KEY}>
      <App />
    </LiveAPIProvider>
  </StrictMode>,
)

// reportWebVitals();