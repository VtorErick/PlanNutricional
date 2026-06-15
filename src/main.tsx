import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DietProvider } from './context/DietContext';
import AppErrorBoundary from './components/AppErrorBoundary';
import {
  isRecoverableAppLoadError,
  reloadAppOnceForRecoverableError,
} from './utils/recoverableAppError';

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (isRecoverableAppLoadError(event.reason) && reloadAppOnceForRecoverableError()) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (isRecoverableAppLoadError(event.error || event.message)) {
      reloadAppOnceForRecoverableError();
    }
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  const fallback = document.createElement('div');
  fallback.className = 'min-h-screen flex items-center justify-center bg-slate-50 px-4';
  fallback.innerHTML = `
    <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <h1 class="text-xl font-black text-slate-900">La app no pudo iniciar</h1>
      <p class="mt-2 text-sm leading-relaxed text-slate-600">
        No encontramos el contenedor principal. Recarga la p&aacute;gina o revisa el montaje de la app.
      </p>
    </div>
  `;
  document.body.appendChild(fallback);
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <DietProvider>
          <App />
        </DietProvider>
      </AppErrorBoundary>
    </React.StrictMode>
  );
}

