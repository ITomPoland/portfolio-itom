import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// --- Console signature ---
if (typeof window !== 'undefined') {
  console.log(
    '%c HAKKILO %c XR %c',
    'background: #111; color: #fff; padding: 5px 10px; font-weight: bold; border-radius: 3px 0 0 3px;',
    'background: #E09F3E; color: #fff; padding: 5px 10px; font-weight: bold; border-radius: 0 3px 3px 0;',
    'background: transparent'
  );
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
