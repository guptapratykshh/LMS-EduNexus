import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './axios-config'; // Configure axios for production

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

