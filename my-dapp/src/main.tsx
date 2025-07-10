// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // 💡 App.tsx만 임포트
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App /> {/* 💡 App 컴포넌트만 렌더링합니다. */}
  </React.StrictMode>,
);