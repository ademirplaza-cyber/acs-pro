import { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';

// Imports diretos (sem lazy) para componentes que podem não ter default export
const LazyDashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: 'default' in m ? m.default : (m as any).Dashboard })));
const LazyVisits = lazy(() => import('./pages/Visits').then(m => ({ default: 'default' in m ? m.default : (m as any).Visits })));
const LazyFamilies = lazy(() => import('./pages/Families').then(m => ({ default: 'default' in m ? m.default : (m as any).Families })));
const LazyFamilyDetails = lazy(() => import('./pages/FamilyDetails').then(m => ({ default: 'default' in m ? m.default : (m as any).FamilyDetails })));
const LazyAdmin = lazy(() => import('./pages/Admin').then(m => ({ default: 'default' in m ? m.default : (m as any).Admin })));
const LazyReports = lazy(() => import('./pages/Reports').then(m => ({ default: 'default' in m ? m.default : (m as any).Reports })));
const LazyNotifications = lazy(() => import('./pages/Notifications').then(m => ({ default: 'default' in m ? m.default : (m as any).Notifications })));
const LazyNotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: 'default' in m ? m.default : (m as any).NotFound })));
const LazySubscription = lazy(() => import('./pages/Subscription').then(m => ({ default: 'default' in m ? m.default : (m as any).Subscription })));
const LazyLogin = lazy(() => import('./pages/Login').then(m => ({ default: 'default' in m ? m.default : (m as any).Login })));
const LazyLandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: 'default' in m ? m.default : (m as any).LandingPage })));

// ProtectedRoute e ErrorBoundary
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

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
