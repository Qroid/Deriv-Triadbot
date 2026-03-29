import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleOAuthCallback } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      // 1. Validate state to prevent CSRF
      if (returnedState !== storedState) {
        setStatus('error');
        setErrorMessage('Security validation failed. Please try logging in again.');
        return;
      }

      // 2. Handle errors from Deriv
      if (params.has('error')) {
        setStatus('error');
        setErrorMessage(params.get('error_description') || params.get('error'));
        return;
      }

      // 3. Extract accounts from URL (Legacy/Alternative Deriv behavior)
      const accounts = [];
      let i = 1;
      while (params.has(`acct${i}`)) {
        accounts.push({
          loginid: params.get(`acct${i}`),
          currency: params.get(`cur${i}`),
        });
        i++;
      }

      if (accounts.length > 0) {
        // Task 7 - Change 3: Build account object from acct1, cur1 only.
        const account = {
          loginid: accounts[0].loginid,
          currency: accounts[0].currency,
          fullname: 'Trader',
          balance: 0
        };
        localStorage.setItem('deriv_display_account', JSON.stringify(account));
        
        // Cleanup
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');

        setStatus('success');
        // Task 7 - Change 2: Use window.location.href = '/' NOT navigate('/')
        setTimeout(() => { window.location.href = '/'; }, 1500);
      } else if (code && codeVerifier) {
        // 4. Token Exchange via Backend
        try {
          const res = await fetch('/api/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              codeVerifier,
              redirectUri: 'https://triadbot.vercel.app/callback',
            }),
          });

          const data = await res.json();

          if (res.ok) {
            // Task 7 - Change 2: Success path
            if (data.account) { 
              localStorage.setItem('deriv_display_account', JSON.stringify(data.account)); 
            } 
            sessionStorage.removeItem('pkce_code_verifier'); 
            sessionStorage.removeItem('oauth_state'); 
            setStatus('success'); 
            setTimeout(() => { window.location.href = '/'; }, 1500); 
          } else {
            setStatus('error');
            setErrorMessage(data.error || 'Failed to exchange authorization code for token.');
          }
        } catch (err) {
          console.error('[auth] exchange error');
          setStatus('error');
          setErrorMessage('An error occurred during secure token exchange.');
        }
      } else {
        setStatus('error');
        setErrorMessage('No trading accounts or valid authorization code were found.');
      }
    };

    processCallback();
  }, [location, handleOAuthCallback]);

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
