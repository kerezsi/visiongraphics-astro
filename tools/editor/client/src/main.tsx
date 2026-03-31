import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './main.css';

// Inject site CSS for block previews
async function injectSiteCSS() {
  try {
    const res = await fetch('/api/files/read?path=src/styles/global.css');
    const { content } = await res.json();
    const style = document.createElement('style');
    style.id = 'site-css';
    style.textContent = content;
    document.head.appendChild(style);
  } catch (e) {
    console.warn('Could not load site CSS for preview:', e);
  }
}

injectSiteCSS();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
