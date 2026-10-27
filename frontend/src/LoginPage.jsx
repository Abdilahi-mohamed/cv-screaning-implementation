import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(location.state?.error || '');
  const [setupError, setSetupError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [creatingOwner, setCreatingOwner] = useState(false);
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios.get(`${API_URL}/owner/auth/setup-status`, { withCredentials: true })
      .then((response) => { if (mounted) setSetupAvailable(response.data.setup_available === true); })
      .catch((requestError) => {
        if (mounted) setSetupError(requestError.response?.data?.message || 'Unable to check owner account setup.');
      })
      .finally(() => { if (mounted) setCheckingSetup(false); });
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (creatingOwner && !/^[a-z0-9][a-z0-9._-]{2,39}$/i.test(username.trim())) {
      setError('Owner username must be 3–40 letters, numbers, dots, underscores, or hyphens.');
      return;
    }
    if (creatingOwner && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = creatingOwner ? '/owner/auth/setup' : '/auth/login';
      const response = await axios.post(`${API_URL}${endpoint}`, { username: username.trim(), password }, { withCredentials: true });
      if (creatingOwner || response.data.user.role === 'owner') {
        navigate('/owner', { replace: true });
        return;
      }
      const returnTo = typeof location.state?.from === 'string'
        && location.state.from.startsWith('/')
        && !location.state.from.startsWith('/owner')
        && !location.state.from.startsWith('/apply')
        ? location.state.from
        : '/';
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Check your username and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page owner-auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-mark"><ShieldCheck size={21} aria-hidden="true" /></div>
        <p className="auth-eyebrow">Secure system access</p>
        <h1 id="login-title">{creatingOwner ? 'Create owner account' : 'Sign in'}</h1>
        <p className="auth-description">{creatingOwner
          ? 'Set up the single owner account. The owner can create and manage company HR accounts.'
          : 'Use your owner or company HR username and password. You will be sent to the dashboard for your account.'}</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="login-username">{creatingOwner ? 'Owner username' : 'Username'}</label>
          <input id="login-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={creatingOwner ? 3 : undefined} maxLength={40} />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete={creatingOwner ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={creatingOwner ? 12 : undefined} maxLength={256} />
          {creatingOwner && <>
            <label htmlFor="login-confirm-password">Confirm password</label>
            <input id="login-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} maxLength={256} />
          </>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {setupError && <p className="auth-error" role="alert">{setupError}</p>}
          <button type="submit" disabled={submitting}>{submitting ? creatingOwner ? 'Creating account…' : 'Signing in…' : creatingOwner ? 'Create owner account' : 'Sign in'}</button>
        </form>
        {!checkingSetup && setupAvailable && <button className="auth-mode-toggle" type="button" onClick={() => { setCreatingOwner((current) => !current); setError(''); setPassword(''); setConfirmPassword(''); }}>{creatingOwner ? 'Already set up? Sign in' : 'First time here? Create the owner account'}</button>}
        {!creatingOwner && <p className="auth-footnote"><LockKeyhole size={14} aria-hidden="true" /> Owner and HR accounts use the same sign-in page</p>}
      </section>
    </main>
  );
}

export default LoginPage;
