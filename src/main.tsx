import React from 'react';
import ReactDOM from 'react-dom/client';
import './theme/tokens.css';
import '@tldraw/tldraw/tldraw.css';
import './theme/tl-overrides.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
