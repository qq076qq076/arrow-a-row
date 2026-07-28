import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './presentation/App';
import './presentation/styles.css';

if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
    console.warn('Service Worker 註冊失敗。', error);
  });
}

const root = document.getElementById('root');

if (root === null) {
  throw new Error('找不到 #root，無法啟動應用程式。');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
