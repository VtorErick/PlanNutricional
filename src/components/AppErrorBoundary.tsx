import React from 'react';
import { clearAppStorage } from '../utils/appStorage';
import {
  isRecoverableAppLoadError,
  reloadAppOnceForRecoverableError,
} from '../utils/recoverableAppError';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  isRecovering: boolean;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    isRecovering: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true, isRecovering: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);

    if (isRecoverableAppLoadError(error) && reloadAppOnceForRecoverableError()) {
      this.setState({ isRecovering: true });
    }
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch (error) {
      console.warn('Failed to reload after error boundary fallback:', error);
    }
  };

  private handleResetStorage = () => {
    clearAppStorage();
    this.handleReload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <h1 className="text-xl font-black text-slate-900">La app tuvo un problema</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Intentamos evitar una pantalla en blanco. Puedes recargar o limpiar
            los datos guardados del navegador si el problema vino de almacenamiento local.
          </p>
          {this.state.isRecovering ? (
            <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              Detectamos una actualizacion pendiente. Recargando...
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Recargar app
            </button>
            <button
              type="button"
              onClick={this.handleResetStorage}
              className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
            >
              Limpiar almacenamiento y recargar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
