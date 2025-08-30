// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './assets/index.css'

/**
 * Entry point:
 * - Finds <div id="root"> in index.html
 * - Mounts the React app tree
 * - StrictMode runs extra checks in development (not in production)
 */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)