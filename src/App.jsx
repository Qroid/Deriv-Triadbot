import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/layout';
import Dashboard from './pages/Dashboard';
import Bots from './pages/Bots';
import TradeHistory from './pages/TradeHistory';
import Settings from './pages/Settings';
import MarketAnalysis from './pages/MarketAnalysis';
import BotBuilder from './pages/BotBuilder';
import OAuthCallback from './pages/OAuthCallback';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
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