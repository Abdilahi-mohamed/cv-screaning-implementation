import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(location.state?.error || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username: username.trim(), password }, { withCredentials: true });
      if (response.data.user.role === 'owner') {
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
        <h1 id="login-title">Sign in</h1>
        <p className="auth-description">Use your owner or company HR username and password. You will be sent to the dashboard for your account.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="login-username">Username</label>
          <input id="login-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={40} />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={256} />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="auth-footnote"><LockKeyhole size={14} aria-hidden="true" /> Owner and HR accounts use the same sign-in page</p>
      </section>
    </main>
  );
}

export default LoginPage;
