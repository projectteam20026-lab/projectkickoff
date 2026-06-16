import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Wake up the Render backend immediately on page load to avoid cold-start delay
fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:5000'}/api/health`).catch(() => {});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
