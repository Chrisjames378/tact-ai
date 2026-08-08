// Catch and suppress expected WebSocket/Vite HMR connection errors in the sandboxed preview.
if (typeof window !== 'undefined') {
  const isWebSocketError = (msg: string) => {
    return msg && (
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('connection') ||
      msg.includes('closed without opened') ||
      msg.includes('Vite HMR')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    if (isWebSocketError(msg)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    const errorMsg = event.error?.message || String(event.error || '');
    if (isWebSocketError(msg) || isWebSocketError(errorMsg)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Analytics} from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
);

// Register Service Worker for PWA installability on mobile devices (e.g., Samsung Galaxy A06)
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(reg => {
        console.log("Tact AI Service Worker registered successfully:", reg.scope);
      })
      .catch(err => {
        console.error("Tact AI Service Worker registration failed:", err);
      });
  });
}
