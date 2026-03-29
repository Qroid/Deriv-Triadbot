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
    const processCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      // 1. Validate state to prevent CSRF
      if (returnedState !== storedState) {
        console.error('OAuth state mismatch. Potential CSRF detected.');
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

      // 3. Extract accounts/tokens from URL (Deriv's unique redirect behavior)
      // Deriv often redirects back with acct1, token1, etc., even in code flow
      const accounts = [];
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
        localStorage.setItem('deriv_token', accounts[0].token);

        // Cleanup
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');

        setStatus('success');
        setTimeout(() => navigate('/'), 1500);
      } else if (code && codeVerifier) {
        // 4. Token Exchange (Backend requirement)
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
            // 1. Handle Multi-Account response (preferred)
            if (data.accounts && Array.isArray(data.accounts)) {
              localStorage.setItem('deriv_accounts', JSON.stringify(data.accounts));
              localStorage.setItem('active_loginid', data.accounts[0].loginid);
              localStorage.setItem('deriv_token', data.accounts[0].token);
            } 
            // 2. Handle single token response - save in format AuthContext reads on mount
            else if (data.access_token) {
              const accounts = [{
                loginid: 'deriv_user',
                token: data.access_token,
                currency: 'USD',
                fullname: 'Trader',
                balance: 0,
              }];
              localStorage.setItem('deriv_accounts', JSON.stringify(accounts));
              localStorage.setItem('active_loginid', 'deriv_user');
              localStorage.setItem('deriv_token', data.access_token);
            }

            // Cleanup security state
            sessionStorage.removeItem('pkce_code_verifier');
            sessionStorage.removeItem('oauth_state');

            setStatus('success');
            // Use window.location instead of navigate so AuthContext re-mounts fresh
            setTimeout(() => { window.location.href = '/'; }, 1500);
          } else {
            setStatus('error');
            setErrorMessage(data.error || 'Failed to exchange authorization code for token.');
          }
        } catch (err) {
          console.error('Exchange error:', err);
          setStatus('error');
          setErrorMessage('An error occurred during secure token exchange.');
        }
      } else {
        setStatus('error');
        setErrorMessage('No trading accounts or valid authorization code were found.');
      }
    };

    processCallback();
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
