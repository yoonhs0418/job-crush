import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // <-- App.tsx를 import 하고
import './index.css';     // <-- index.css를 import 하고

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);