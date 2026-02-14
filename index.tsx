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
    console.error("React Mounting Error:", error);
    container.innerHTML = `
      <div style="padding:40px;text-align:center;font-family:sans-serif;">
        <h2 style="color:#e11d48;">Errore di inizializzazione</h2>
        <p style="color:#64748b;">${error instanceof Error ? error.message : "Impossibile avviare React."}</p>
      </div>
    `;
  }
}