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
    console.error("React Render Error:", error);
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: sans-serif;">
        <h2 style="color: #ef4444; font-weight: 800;">Errore Critico</h2>
        <p style="color: #64748b;">L'applicazione non è riuscita ad avviarsi correttamente.</p>
        <pre style="background: #f1f5f9; padding: 20px; border-radius: 12px; font-size: 12px; display: inline-block; margin-top: 20px; text-align: left; max-width: 100%; overflow: auto;">
${error instanceof Error ? error.stack || error.message : String(error)}
        </pre>
      </div>
    `;
  }
}