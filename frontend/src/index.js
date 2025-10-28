import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 确保 process 对象在全局可用
if (typeof window !== 'undefined' && !window.process) {
  window.process = require('process/browser.js');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);