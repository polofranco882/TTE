import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GamificationProvider } from './context/GamificationContext.tsx'

// Polyfill for console.timeStamp to prevent React crashes
if (!console.timeStamp) {
  console.timeStamp = () => { };
}

// iOS Safari viewport height fix: 100vh includes hidden browser chrome
// This keeps --vh synced to the true visible height
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setViewportHeight();
window.addEventListener('resize', setViewportHeight, { passive: true });
window.addEventListener('orientationchange', () => {
  // Small delay to let iOS finish the orientation animation before measuring
  setTimeout(setViewportHeight, 150);
}, { passive: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GamificationProvider>
      <App />
    </GamificationProvider>
  </StrictMode>,
)
