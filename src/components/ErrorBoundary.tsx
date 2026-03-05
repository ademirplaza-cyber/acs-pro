import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
            <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-3">Algo deu errado</h1>
            <p className="text-slate-600 mb-6">
              Ocorreu um erro inesperado. Seus dados estão seguros.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Recarregar App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
