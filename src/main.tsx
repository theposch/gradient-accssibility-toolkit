import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App';
import './index.css';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster position="bottom-center" richColors />
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
); 