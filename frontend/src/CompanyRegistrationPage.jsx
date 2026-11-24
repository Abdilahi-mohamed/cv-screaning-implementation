import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Building2, CheckCircle2, LockKeyhole, UserRound } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const providers = [
  { name: 'ZAAD', label: 'ZAAD (Telesom)' },
  { name: 'eDahab', label: 'eDahab (Somtel)' },
  { name: 'Bank Transfer', label: 'Bank Transfer' },
  { name: 'Golis', label: 'Golis' },
  { name: 'Hormuud', label: 'Hormuud' },
];

function BrandMark() {
  return (
    <svg width="42" height="26" viewBox="0 0 200 120" aria-hidden="true">
      <path d="M87.6 32.4 A39 39 0 1 0 87.6 87.6" fill="none" stroke="#2f2dd6" strokeWidth="22" />
      <polygon points="96,10 120,10 146,78.4 172,10 196,10 158,110 134,110" fill="#2f2dd6" />
    </svg>
  );
}

function ProviderMark({ provider }) {
  if (!provider) return null;
  if (provider === 'ZAAD') {
    return <span className="registration-provider-logo registration-provider-zaad" aria-label="ZAAD Telesom"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#fff"/><path d="M9 10h14l-9 11h8v3H7l9-11H9z" fill="#00A651"/></svg></span>;
  }
  if (provider === 'eDahab') {
    return <span className="registration-provider-logo registration-provider-edahab" aria-label="eDahab Somtel"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#fff"/><path d="M8 17.5a8 8 0 1 1 2.3 5.7l-2.6-2.6A4.5 4.5 0 1 0 12 12.5v3.5H8v1.5Z" fill="#D71920"/><path d="M13 12h11v4H13z" fill="#D71920"/></svg></span>;
  }
  if (provider === 'Golis') {
    return <span className="registration-provider-logo registration-provider-golis" aria-label="Golis"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#fff"/><path d="M16 5l10 5v7c0 6-4.2 9.3-10 11-5.8-1.7-10-5-10-11v-7l10-5Z" fill="#E9A200"/><text x="16" y="20" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">G</text></svg></span>;
  }
  if (provider === 'Hormuud') {
    return <span className="registration-provider-logo registration-provider-hormuud" aria-label="Hormuud"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#fff"/><path d="M8 7h5v7h6V7h5v18h-5v-7h-6v7H8z" fill="#E30613"/></svg></span>;
  }
  return <span className="registration-provider-logo registration-provider-bank" aria-label="Bank Transfer"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="26" height="26" rx="13" fill="#fff"/><path d="M16 6l10 5v3H6v-3l10-5Zm-8 10h3v7H8v-7Zm6 0h3v7h-3v-7Zm6 0h3v7h-3v-7Zm6 0h3v7h-3v-7ZM6 25h20v3H6z" fill="#1D4ED8"/></svg></span>;
}

export default function CompanyRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    companyName: '',
    username: '',
    password: '',
    confirmPassword: '',
    amount: '25',
    provider: '',
    senderAccount: '',
    acceptedTerms: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.';
    if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(form.username)) return 'Username must be 3–40 characters using letters, numbers, dots, underscores, or hyphens.';
    if (form.password.length < 8 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      return 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.';
    }
    if (form.password !== form.confirmPassword) return 'Password and confirm password do not match.';
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount < 25) return 'Payment amount must be 25 USD or more.';
    if (!form.provider) return 'Select a payment provider.';
    if (form.provider === 'Bank Transfer'
      ? !/^[A-Za-z0-9][A-Za-z0-9 -]{5,34}$/.test(form.senderAccount)
      : !/^\+?[0-9]{7,15}$/.test(form.senderAccount)) {
      return form.provider === 'Bank Transfer'
        ? 'Enter a valid bank account number.'
        : 'Enter a valid phone number.';
    }
    if (!form.acceptedTerms) return 'Accept the Terms & Conditions to continue.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register-company`, form, { withCredentials: true });
      setSuccess(`${response.data.message} Reference: ${response.data.reference}`);
      window.setTimeout(() => navigate('/login', {
        replace: true,
        state: { success: 'Registration submitted. Payment verification is pending and access will be activated after approval.' },
      }), 1800);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit the registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="registration-page">
      <header className="registration-header">
        <div className="landing-wrap registration-header-inner">
          <Link className="landing-brand" to="/"><BrandMark /><span>CV Screening</span></Link>
          <Link className="registration-back" to="/"><ArrowLeft size={16} /> Back to homepage</Link>
        </div>
      </header>

      <div className="landing-wrap registration-layout">
        <aside className="registration-summary">
          <p className="landing-eyebrow">Company workspace</p>
          <h1>Create your CV Screening account</h1>
          <p>Register your company and submit payment verification for approval.</p>
          <div className="registration-steps">
            <span className="is-active"><b>1</b> Account details</span>
            <span><b>2</b> Payment information</span>
            <span><b>3</b> Owner approval</span>
          </div>
        </aside>

        <form className="registration-form" onSubmit={handleSubmit}>
          <section>
            <div className="registration-section-heading"><UserRound size={18} /><div><h2>Account Information</h2><p>Company administrator details</p></div></div>
            <div className="registration-grid">
              <label>Full Name<input name="name" value={form.name} onChange={update('name')} required minLength={2} maxLength={100} autoComplete="name" /></label>
              <label>Email Address<input name="email" type="email" value={form.email} onChange={update('email')} required maxLength={254} autoComplete="email" /></label>
              <label>Company Name<input name="companyName" value={form.companyName} onChange={update('companyName')} required minLength={2} maxLength={120} autoComplete="organization" /></label>
              <label>Username<input name="username" value={form.username} onChange={update('username')} required minLength={3} maxLength={40} autoComplete="username" /></label>
              <label>Password<input name="password" type="password" value={form.password} onChange={update('password')} required minLength={8} maxLength={256} autoComplete="new-password" /></label>
              <label>Confirm Password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} required minLength={8} maxLength={256} autoComplete="new-password" /></label>
            </div>
          </section>

          <section>
            <div className="registration-section-heading"><Building2 size={18} /><div><h2>Payment Information</h2><p>Submit payment details for verification</p></div></div>
            <div className="registration-grid">
              <label>Payment Amount (USD) — minimum 25$ per month<input name="amount" type="number" value={form.amount} onChange={update('amount')} required min="25" step="1" inputMode="decimal" placeholder="25" /></label>
              <label>Payment Provider<select name="provider" value={form.provider} onChange={update('provider')} required><option value="">Select provider</option>{providers.map((provider) => <option key={provider.name} value={provider.name}>{provider.label}</option>)}</select></label>
              <label>Sender Phone Number / Account Number<input name="senderAccount" value={form.senderAccount} onChange={update('senderAccount')} required maxLength={35} placeholder={form.provider === 'Bank Transfer' ? 'Bank account number' : 'e.g. 252634594307'} /></label>
            </div>
            {form.provider && <div className="registration-provider-preview"><ProviderMark provider={form.provider} /><div><small>Selected provider</small><strong>{form.provider}</strong></div></div>}
          </section>

          <label className="registration-terms"><input type="checkbox" checked={form.acceptedTerms} onChange={update('acceptedTerms')} required /><span>I accept the <a href="#terms">Terms &amp; Conditions</a>.</span></label>
          {error && <p className="registration-alert is-error" role="alert">{error}</p>}
          {success && <p className="registration-alert is-success" role="status"><CheckCircle2 size={16} /> {success}</p>}
          <button className="registration-submit" type="submit" disabled={submitting}><LockKeyhole size={17} /> {submitting ? 'Submitting…' : 'Create Company Account'}</button>
        </form>
      </div>
    </main>
  );
}
