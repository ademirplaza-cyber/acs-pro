import { Suspense, lazy, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { UserRole } from './types';
import SplashScreen from './components/SplashScreen';

// Lazy loading para performance
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Visits = lazy(() => import('./pages/Visits').then(m => ({ default: m.Visits })));
const Families = lazy(() => import('./pages/Families').then(m => ({ default: m.Families })));
const FamilyDetails = lazy(() => import('./pages/FamilyDetails').then(m => ({ default: m.FamilyDetails })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.default })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.default })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.default })));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-slate-600">Carregando página...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Página pública — Landing Page */}
        <Route path="/home" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        
        {/* Login / Registro */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        
        {/* Páginas protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/visits" element={<ProtectedRoute><Visits /></ProtectedRoute>} />
        <Route path="/families" element={<ProtectedRoute><Families /></ProtectedRoute>} />
        <Route path="/families/:id" element={<ProtectedRoute><FamilyDetails /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        
        <Route path="/admin" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <Admin />
          </ProtectedRoute>
        } />

        {/* Rota raiz: logado vai pro dashboard, não logado vai pra landing */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashShown, setSplashShown] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('acs_splash_shown');
    if (alreadyShown) {
      setShowSplash(false);
      setSplashShown(true);
    }
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setSplashShown(true);
    sessionStorage.setItem('acs_splash_shown', 'true');
  };

  return (
    <ErrorBoundary>
      {showSplash && !splashShown && (
        <SplashScreen onFinish={handleSplashFinish} minDuration={3000} />
      )}
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
