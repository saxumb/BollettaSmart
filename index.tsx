import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');
if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to render React app:", error);
    container.innerHTML = `<div style="padding: 20px; color: red;">Si è verificato un errore durante il caricamento dell'app. Controlla la console per i dettagli.</div>`;
  }
}

// Registrazione Service Worker per PWA (solo HTTPS)
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .catch(err => console.warn('PWA: Service Worker non registrato', err));
  });
}