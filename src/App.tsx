import { useState, useEffect, Suspense, lazy, ComponentType } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Helper para lazy load de named exports
function lazyNamed<T extends ComponentType<any>>(
  factory: () => Promise<{ [key: string]: T }>
) {
  return lazy(() =>
    factory().then((module) => {
      // Pegar o primeiro export que não seja 'default' ou retornar default
      if ('default' in module) return { default: module.default };
      const key = Object.keys(module)[0];
      return { default: module[key] };
    })
  );
}

// Páginas com named export (export const)
const LazyDashboard = lazyNamed(() => import('./pages/Dashboard'));
const LazyFamilies = lazyNamed(() => import('./pages/Families'));
const LazyVisits = lazyNamed(() => import('./pages/Visits'));
const LazyReports = lazyNamed(() => import('./pages/Reports'));
const LazyAdmin = lazyNamed(() => import('./pages/Admin'));
const LazyFamilyDetails = lazyNamed(() => import('./pages/FamilyDetails'));
const LazyLogin = lazyNamed(() => import('./pages/Login'));

// Páginas com default export (export default)
const LazyNotifications = lazy(() => import('./pages/Notifications'));
const LazyNotFound = lazy(() => import('./pages/NotFound'));
const LazyLandingPage = lazy(() => import('./pages/LandingPage'));
const LazySubscription = lazy(() => import('./pages/Subscription'));

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Carregando...</p>
    </div>
  </div>
);

// Componente de rotas
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/home" element={<LazyLandingPage />} />
        <Route path="/login" element={<LazyLogin />} />

        {/* Rotas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <LazyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <LazyReports />
          </ProtectedRoute>
        } />
        <Route path="/visits" element={
          <ProtectedRoute>
            <LazyVisits />
          </ProtectedRoute>
        } />
        <Route path="/families" element={
          <ProtectedRoute>
            <LazyFamilies />
          </ProtectedRoute>
        } />
        <Route path="/families/:id" element={
          <ProtectedRoute>
            <LazyFamilyDetails />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <LazyNotifications />
          </ProtectedRoute>
        } />
        <Route path="/meeting" element={
          <ProtectedRoute>
            <LazyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/subscription" element={
          <ProtectedRoute>
            <LazySubscription />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <LazyAdmin />
          </ProtectedRoute>
        } />

        {/* Rota raiz */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />
        } />

        {/* 404 */}
        <Route path="*" element={<LazyNotFound />} />
      </Routes>
    </Suspense>
  );
}

// Splash screen
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-green-600">
      <div className="text-center animate-fade-in">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <span className="text-4xl">🏥</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">ACS Top</h1>
        <p className="text-blue-100 text-lg">Saúde da Família</p>
        <div className="mt-8">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown');
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
