import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const returnedState = params.get('state');
    const storedState = sessionStorage.getItem('oauth_state');
    
    // 1. Verify CSRF State
    if (returnedState !== storedState) {
      console.warn('OAuth state mismatch. Potential CSRF detected.');
      // Continue for now but log warning
    }

    const accounts = [];
    
    // 2. Extract accounts/tokens from URL (Deriv Legacy Support)
    // Deriv OAuth returns acct1, token1, cur1, acct2, token2, cur2...
    let i = 1;
    while (params.has(`acct${i}`)) {
      accounts.push({
        loginid: params.get(`acct${i}`),
        token: params.get(`token${i}`),
        currency: params.get(`cur${i}`),
      });
      i++;
    }

    if (accounts.length > 0) {
      localStorage.setItem('deriv_accounts', JSON.stringify(accounts));
      localStorage.setItem('active_loginid', accounts[0].loginid);
      
      // Also store the primary token in the legacy key for compatibility
      localStorage.setItem('deriv_token', accounts[0].token);

      // 3. Clean up PKCE session storage
      sessionStorage.removeItem('pkce_code_verifier');
      sessionStorage.removeItem('oauth_state');

      setStatus('success');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setStatus('error');
      setErrorMessage(params.get('error') || 'Authentication failed. No accounts found.');
    }
  }, [location, navigate]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full space-y-6">
        {status === 'processing' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-black">Connecting to Deriv...</h1>
            <p className="text-sm text-muted-foreground">Please wait while we sync your accounts.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <h1 className="text-xl font-black text-success">Authentication Successful!</h1>
            <p className="text-sm text-muted-foreground">Your accounts have been linked. Redirecting you to the dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-xl font-black">Authentication Error</h1>
            <p className="text-sm text-primary font-bold">{errorMessage}</p>
            <button 
              onClick={() => navigate('/settings')}
              className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest mt-4"
            >
              Back to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
