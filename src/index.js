import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

if (!sessionStorage.getItem('page_refreshed')) {
  // First load in this session — clear the previous session's auth flag
  sessionStorage.setItem('page_refreshed', 'true');
}

window.addEventListener('beforeunload', () => {
  // If this is the LAST tab closing, the next open will clear auth
  sessionStorage.removeItem('page_refreshed');
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
