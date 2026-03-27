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
    // Deriv OAuth can return params in either the query string OR the hash fragment
    const getParams = () => {
      const queryParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
      
      // Merge both, query taking precedence
      const combined = {};
      for (const [key, value] of hashParams.entries()) combined[key] = value;
      for (const [key, value] of queryParams.entries()) combined[key] = value;
      return combined;
    };

    const params = getParams();
    const accounts = [];
    
    // Extract accounts/tokens from params (acct1, token1, cur1...)
    let i = 1;
    while (params[`acct${i}`]) {
      accounts.push({
        loginid: params[`acct${i}`],
        token: params[`token${i}`],
        currency: params[`cur${i}`],
      });
      i++;
    }

    if (accounts.length > 0) {
      localStorage.setItem('deriv_accounts', JSON.stringify(accounts));
      localStorage.setItem('active_loginid', accounts[0].loginid);
      localStorage.setItem('deriv_token', accounts[0].token);

      setStatus('success');
      setTimeout(() => navigate('/'), 1500);
    } else {
      console.error('OAuth Failed. Params received:', params);
      setStatus('error');
      setErrorMessage(params['error'] || 'Authentication failed. No accounts found in the response.');
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
