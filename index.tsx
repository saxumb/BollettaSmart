import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

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
    console.error("Critical Start Error:", error);
    container.innerHTML = `<div style="padding:40px;text-align:center;"><h2>Errore Critico</h2><p>${error}</p></div>`;
  }
}