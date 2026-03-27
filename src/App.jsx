import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/layout';

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bots = lazy(() => import('./pages/Bots'));
const TradeHistory = lazy(() => import('./pages/TradeHistory'));
const Settings = lazy(() => import('./pages/Settings'));
const MarketAnalysis = lazy(() => import('./pages/MarketAnalysis'));
const BotBuilder = lazy(() => import('./pages/BotBuilder'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Loading Triadbot...</p>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingFallback />;
  }

  // Render the main app
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bots" element={<Bots />} />
          <Route path="/history" element={<TradeHistory />} />
          <Route path="/market" element={<MarketAnalysis />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/builder" element={<BotBuilder />} />
          <Route path="/callback" element={<OAuthCallback />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App