import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BriefcaseBusiness, LockKeyhole } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function HRLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`${API_URL}/auth/login`, { username: username.trim(), password }, { withCredentials: true });
      const returnTo = typeof location.state?.from === 'string' && !location.state.from.startsWith('/owner')
        ? location.state.from
        : '/';
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="hr-login-title">
        <div className="auth-mark"><BriefcaseBusiness size={21} aria-hidden="true" /></div>
        <p className="auth-eyebrow">Company workspace</p>
        <h1 id="hr-login-title">HR dashboard sign in</h1>
        <p className="auth-description">Use the username and password assigned by your system owner.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="hr-username">Username</label>
          <input id="hr-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          <label htmlFor="hr-password">Password</label>
          <input id="hr-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in to company dashboard'}</button>
        </form>
        <p className="auth-footnote"><LockKeyhole size={14} aria-hidden="true" /> Secure company account access</p>
      </section>
    </main>
  );
}

export default HRLoginPage;
