import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GamificationProvider } from './context/GamificationContext.tsx'

// Polyfill for console.timeStamp to prevent React crashes
if (!console.timeStamp) {
  console.timeStamp = () => { };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GamificationProvider>
      <App />
    </GamificationProvider>
  </StrictMode>,
)
