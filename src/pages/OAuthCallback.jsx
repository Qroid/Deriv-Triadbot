import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleOAuthCallback } = useAuth();
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      // 1. Validate CSRF state
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

      // 3. Legacy / Alternative Deriv path — accounts come directly in the URL params
      //    e.g. acct1=VRTC..., token1=..., acct2=CR..., token2=...
      const accounts = [];
      let i = 1;
      while (params.has(`acct${i}`)) {
        accounts.push({
          loginid: params.get(`acct${i}`),
          currency: params.get(`cur${i}`) || 'USD',
          token: params.get(`token${i}`),
          is_virtual: (params.get(`acct${i}`) || '').startsWith('VRTC') ? 1 : 0,
          fullname: 'Trader',
          balance: 0,
        });
        i++;
      }

      if (accounts.length > 0) {
        // Send the primary token to backend to set the secure cookie.
        // We also pass all accounts' tokens so the backend knows which is primary.
        const primaryToken = accounts[0].token;
        try {
          const res = await fetch('/api/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: primaryToken }),
          });

          if (res.ok) {
            // Save all accounts to localStorage (demo + real)
            localStorage.setItem('deriv_accounts', JSON.stringify(accounts));

            // Default active account: prefer demo (VRTC) first
            const demoAccount = accounts.find(a => a.is_virtual === 1) || accounts[0];
            const realAccount = accounts.find(a => a.is_virtual === 0) || null;

            localStorage.setItem('deriv_display_account', JSON.stringify(demoAccount));
            localStorage.setItem('active_loginid', demoAccount.loginid);

            // Also store real account token separately for switching
            if (realAccount) {
              localStorage.setItem('deriv_real_token', realAccount.token);
            }
            // Store virtual account token separately
            if (demoAccount) {
              localStorage.setItem('deriv_demo_token', demoAccount.token);
            }

            sessionStorage.removeItem('pkce_code_verifier');
            sessionStorage.removeItem('oauth_state');

            setStatus('success');
            setTimeout(() => { window.location.href = '/'; }, 1500);
          } else {
            throw new Error('Failed to synchronize session with backend');
          }
        } catch (err) {
          console.error('[auth] legacy sync error:', err);
          setStatus('error');
          setErrorMessage('Failed to securely link your account. Please try again.');
        }

      } else if (code && codeVerifier) {
        // 4. Standard OAuth2 PKCE code exchange
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
            // Store all accounts returned from the backend
            if (Array.isArray(data.accounts) && data.accounts.length > 0) {
              localStorage.setItem('deriv_accounts', JSON.stringify(data.accounts));

              const demoAccount = data.accounts.find(a => a.is_virtual === 1) || data.accounts[0];
              const realAccount = data.accounts.find(a => a.is_virtual === 0) || null;

              localStorage.setItem('deriv_display_account', JSON.stringify(demoAccount));
              localStorage.setItem('active_loginid', demoAccount.loginid);

              if (realAccount) localStorage.setItem('deriv_real_token', realAccount.token);
              if (demoAccount) localStorage.setItem('deriv_demo_token', demoAccount.token);
            } else if (data.account) {
              localStorage.setItem('deriv_accounts', JSON.stringify([data.account]));
              localStorage.setItem('deriv_display_account', JSON.stringify(data.account));
              localStorage.setItem('active_loginid', data.account.loginid);
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
          console.error('[auth] exchange error:', err);
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
            <p className="text-sm text-muted-foreground">Syncing your Demo & Real accounts.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <h1 className="text-xl font-black text-success">Authentication Successful!</h1>
            <p className="text-sm text-muted-foreground">Your accounts are linked. Redirecting to dashboard...</p>
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
