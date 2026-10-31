import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Order matters: tokens → device shell → simulated apps → Trace itself.
import './styles/tokens.css';
import './styles/shell.css';
import './styles/apps.css';
import './styles/trace.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
