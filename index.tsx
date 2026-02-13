import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Registrazione Service Worker per PWA (solo in produzione/HTTPS)
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then(reg => console.log('PWA: Service Worker pronto'))
      .catch(err => console.warn('PWA: Errore registrazione SW', err));
  });
}

const startApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}