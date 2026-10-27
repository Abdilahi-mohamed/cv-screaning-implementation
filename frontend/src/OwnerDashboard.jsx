import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import {
  Activity,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronRight,
  CircleAlert,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const PERMISSION_OPTIONS = [
  { value: 'jobs:manage', label: 'Manage jobs' },
  { value: 'candidates:manage', label: 'Manage candidates and evaluations' },
  { value: 'settings:manage', label: 'Manage workspace settings' },
];
const emptyStats = { companies: 0, active_companies: 0, suspended_companies: 0, hr_users: 0, jobs: 0, candidates: 0 };
const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';
const timeLabel = (value) => value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No sign-in yet';

function OwnerDashboard() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    let mounted = true;
    axios.get(`${API_URL}/owner/auth/me`, { withCredentials: true })
      .then((response) => { if (mounted) setUser(response.data.user); })
      .catch((error) => {
        if (mounted && error.response?.status !== 401) {
          setSessionError(error.response?.data?.message || 'Unable to connect to the owner service.');
        }
      })
      .finally(() => { if (mounted) setCheckingSession(false); });
    return () => { mounted = false; };
  }, []);

  if (checkingSession) return <div className="owner-loading" role="status">Checking owner session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: '/owner', error: sessionError }} />;
  return <OwnerWorkspace user={user} onLogout={() => setUser(null)} />;
}

function OwnerWorkspace({ user, onLogout }) {
  const [section, setSection] = useState('dashboard');
  const [stats, setStats] = useState(emptyStats);
  const [companies, setCompanies] = useState([]);
  const [settings, setSettings] = useState({ allow_public_applications: true, default_brand_color: '#2f6f9f' });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [modalCompany, setModalCompany] = useState(null);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [dashboardResponse, companiesResponse, settingsResponse] = await Promise.all([
        axios.get(`${API_URL}/owner/dashboard`, { withCredentials: true }),
        axios.get(`${API_URL}/owner/companies`, { withCredentials: true }),
        axios.get(`${API_URL}/owner/settings`, { withCredentials: true }),
      ]);
      setStats(dashboardResponse.data.stats || emptyStats);
      setCompanies(Array.isArray(companiesResponse.data) ? companiesResponse.data : []);
      setSettings(settingsResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load system data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const activeCompanies = useMemo(() => companies.filter((company) => company.status !== 'deleted'), [companies]);
  const visibleCompanies = useMemo(() => activeCompanies.filter((company) =>
    `${company.name} ${company.hr_user?.username || ''} ${company.hr_user?.email || ''}`.toLowerCase().includes(query.trim().toLowerCase())), [activeCompanies, query]);

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/owner/auth/logout`, {}, { withCredentials: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to end the owner session.');
      return;
    }
    onLogout();
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    setNotice('');
    setError('');
    try {
      const response = await axios.put(`${API_URL}/owner/settings`, settings, { withCredentials: true });
      setSettings(response.data);
      setNotice('System settings saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save system settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const updateCompanyStatus = async (company, status) => {
    setError('');
    setNotice('');
    try {
      await axios.patch(`${API_URL}/owner/companies/${company.company_id}`, { status }, { withCredentials: true });
      setNotice(`${company.name} is now ${status}.`);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this company.');
    }
  };

  const deleteCompany = async (company) => {
    if (!window.confirm(`Delete ${company.name} and disable its HR account? Its historical records will be retained for audit purposes.`)) return;
    setError('');
    setNotice('');
    try {
      await axios.delete(`${API_URL}/owner/companies/${company.company_id}`, { withCredentials: true });
      setNotice(`${company.name} was deleted. Its historical records are retained and no longer accessible to company users.`);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this company.');
    }
  };

  const saveCompany = async (payload) => {
    setError('');
    setNotice('');
    try {
      if (modalCompany?.company_id) {
        await axios.patch(`${API_URL}/owner/companies/${modalCompany.company_id}`, {
          name: payload.name,
        }, { withCredentials: true });
        const { username, name: hrName, email, active, permissions, password } = payload.hr_user;
        const updateUser = { username, name: hrName, email, active, permissions };
        if (password) updateUser.password = password;
        await axios.patch(`${API_URL}/owner/companies/${modalCompany.company_id}/hr-user`, updateUser, { withCredentials: true });
        setNotice('Company account and HR access updated.');
      } else {
        await axios.post(`${API_URL}/owner/companies`, {
          name: payload.name,
          hr_username: payload.hr_user.username,
          hr_password: payload.hr_user.password,
          hr_name: payload.hr_user.name,
          hr_email: payload.hr_user.email,
        }, { withCredentials: true });
        setNotice('Company workspace and HR account created.');
      }
      setModalCompany(null);
      await refresh();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save this company account.';
      setError(message);
      throw new Error(message);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', detail: 'System overview', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', detail: 'Workspaces & accounts', icon: Building2 },
    { id: 'users', label: 'HR users', detail: 'Access & permissions', icon: Users },
    { id: 'activity', label: 'Activity', detail: 'Latest account use', icon: Activity },
    { id: 'settings', label: 'System settings', detail: 'Platform configuration', icon: SlidersHorizontal },
  ];
  const titles = {
    dashboard: ['System overview', 'Monitor company workspaces and recruitment activity across the platform.'],
    companies: ['Company accounts', 'Create, update, suspend, activate, or delete isolated company workspaces.'],
    users: ['HR users & permissions', 'Manage company credentials, account access, and role permissions.'],
    activity: ['Recent activity', 'Review recent HR sign-ins and company workspace activity.'],
    settings: ['System settings', 'Manage public applications and the default company brand color.'],
  };

  return (
    <div className="owner-shell">
      <aside className="owner-sidebar">
        <div className="owner-brand">
          <div className="owner-brand-mark"><ShieldCheck size={22} aria-hidden="true" /></div>
          <div><strong>TalentPulse</strong><span>System control</span></div>
        </div>
        <p className="owner-nav-caption">ADMINISTRATION</p>
        <nav className="owner-nav" aria-label="Owner navigation">
          {navItems.map(({ id, label, detail, icon: Icon }) => (
            <button key={id} type="button" className={`owner-nav-item ${section === id ? 'is-active' : ''}`} onClick={() => { setSection(id); setError(''); setNotice(''); }}>
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span><strong>{label}</strong><small>{detail}</small></span>
              {section === id && <ChevronRight className="owner-nav-chevron" size={16} aria-hidden="true" />}
            </button>
          ))}
        </nav>
        <div className="owner-sidebar-footer">
          <div className="owner-avatar">{(user.name || user.username || 'O').slice(0, 1).toUpperCase()}</div>
          <div className="owner-user-info"><strong>{user.name || 'System owner'}</strong><span>{user.username}</span></div>
          <button type="button" className="owner-icon-button" title="Sign out" aria-label="Sign out" onClick={logout}><LogOut size={17} /></button>
        </div>
      </aside>
      <main className="owner-main">
        <header className="owner-topbar">
          <div className="owner-breadcrumb"><span>System</span><ChevronRight size={14} /><strong>{navItems.find((item) => item.id === section)?.label}</strong></div>
          <div className="owner-topbar-meta"><span className="owner-status-dot" /> Owner access <span className="owner-date">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
        </header>
        <div className="owner-content">
          <div className="owner-page-heading">
            <div><p className="owner-eyebrow">SYSTEM ADMINISTRATION</p><h1>{titles[section][0]}</h1><p>{titles[section][1]}</p></div>
            {(section === 'companies' || section === 'dashboard') && <button className="owner-primary-button" type="button" onClick={() => setModalCompany({})}><Plus size={17} /> Create company</button>}
            {section === 'users' && <button className="owner-primary-button" type="button" onClick={() => setModalCompany({ createHrUser: true })}><Plus size={17} /> Create HR user</button>}
          </div>
          {error && <div className="owner-alert owner-alert-error" role="alert"><CircleAlert size={17} />{error}<button type="button" aria-label="Dismiss error" onClick={() => setError('')}><X size={16} /></button></div>}
          {notice && <div className="owner-alert owner-alert-success" role="status"><Check size={17} />{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16} /></button></div>}
          {loading ? <div className="owner-empty" role="status">Loading system data…</div> : (
            <>
              {section === 'dashboard' && <DashboardOverview stats={stats} companies={activeCompanies} onViewCompanies={() => setSection('companies')} onEditCompany={setModalCompany} />}
              {section === 'companies' && (
                <CompanyList companies={visibleCompanies} query={query} onQuery={setQuery} onEdit={setModalCompany} onToggle={updateCompanyStatus} onDelete={deleteCompany} />
              )}
              {section === 'users' && <UserList companies={activeCompanies} onEdit={setModalCompany} />}
              {section === 'activity' && <ActivityList companies={activeCompanies} />}
              {section === 'settings' && <SystemSettingsForm settings={settings} onChange={setSettings} onSave={saveSettings} saving={savingSettings} />}
            </>
          )}
        </div>
      </main>
      {modalCompany && <CompanyModal company={modalCompany.company_id ? modalCompany : null} createHrUser={modalCompany.createHrUser} onClose={() => setModalCompany(null)} onSave={saveCompany} />}
    </div>
  );
}

function DashboardOverview({ stats, companies, onViewCompanies, onEditCompany }) {
  const metrics = [
    { label: 'Company accounts', value: stats.companies, note: `${stats.active_companies} active workspaces`, icon: Building2, color: 'blue' },
    { label: 'HR users', value: stats.hr_users, note: 'Assigned company accounts', icon: Users, color: 'teal' },
    { label: 'Job openings', value: stats.jobs, note: 'Across all workspaces', icon: BriefcaseBusiness, color: 'slate' },
    { label: 'Candidates', value: stats.candidates, note: 'System-wide applications', icon: Activity, color: 'green' },
  ];
  return (
    <div className="owner-dashboard-content">
      <section className="owner-metric-grid" aria-label="System statistics">
        {metrics.map(({ label, value, note, icon: Icon, color }) => (
          <article className="owner-metric-card" key={label}>
            <div className={`owner-metric-icon ${color}`}><Icon size={20} aria-hidden="true" /></div>
            <p>{label}</p><strong>{Number(value || 0).toLocaleString()}</strong><span>{note}</span>
          </article>
        ))}
      </section>
      <section className="owner-overview-grid">
        <div className="owner-panel owner-companies-panel">
          <div className="owner-panel-heading"><div><h2>Company workspaces</h2><p>Latest company accounts</p></div><button type="button" className="owner-text-button" onClick={onViewCompanies}>View all <ChevronRight size={15} /></button></div>
          {companies.length ? (
            <div className="owner-table-wrap">
              <table className="owner-table">
                <thead><tr><th>Company</th><th>HR user</th><th>Status</th><th>Jobs</th><th aria-label="Actions" /></tr></thead>
                <tbody>{companies.slice(0, 5).map((company) => (
                  <tr key={company.company_id}>
                    <td><span className="owner-company-cell"><span className="owner-company-initial">{company.name.slice(0, 1).toUpperCase()}</span><span><strong>{company.name}</strong><small>Created {dateLabel(company.created_at)}</small></span></span></td>
                    <td>{company.hr_user?.username || 'No HR user'}</td>
                    <td><StatusBadge status={company.status} /></td>
                    <td>{company.job_count || 0}</td>
                    <td><button type="button" className="owner-row-action" onClick={() => onEditCompany(company)}>Manage</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="owner-empty">No company workspaces yet. Create one to provision an isolated HR dashboard.</p>}
        </div>
        <div className="owner-panel owner-health-panel">
          <div className="owner-panel-heading"><div><h2>Workspace health</h2><p>Account status summary</p></div><span className="owner-health-icon"><Activity size={18} /></span></div>
          <div className="owner-health-total"><strong>{stats.active_companies || 0}</strong><span>active workspaces</span></div>
          <div className="owner-health-bar"><span style={{ width: `${stats.companies ? Math.min((stats.active_companies / stats.companies) * 100, 100) : 0}%` }} /></div>
          <div className="owner-health-legend"><span><i className="is-active" /> Active <strong>{stats.active_companies || 0}</strong></span><span><i className="is-suspended" /> Suspended <strong>{stats.suspended_companies || 0}</strong></span></div>
          <div className="owner-health-note"><ShieldCheck size={16} /><span>Company records are isolated by workspace. HR access is checked on every protected API request.</span></div>
        </div>
      </section>
    </div>
  );
}

function CompanyList({ companies, query, onQuery, onEdit, onToggle, onDelete }) {
  return (
    <section className="owner-panel">
      <div className="owner-panel-heading owner-list-heading"><div><h2>Company directory</h2><p>Each company receives a private HR workspace and credentials.</p></div><label className="owner-search"><Search size={16} /><input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search companies or HR users" aria-label="Search companies or HR users" /></label></div>
      <div className="owner-table-wrap">
        <table className="owner-table">
          <thead><tr><th>Company</th><th>HR account</th><th>Workspace</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>{companies.map((company) => (
            <tr key={company.company_id}>
              <td><span className="owner-company-cell"><span className="owner-company-initial">{company.name.slice(0, 1).toUpperCase()}</span><span><strong>{company.name}</strong><small>{company.company_id}</small></span></span></td>
              <td><span className="owner-user-cell"><strong>{company.hr_user?.username || 'No HR user'}</strong><small>{company.hr_user?.email || company.hr_user?.name || '—'}</small></span></td>
              <td><span className="owner-workspace-count">{company.job_count || 0} jobs</span><span className="owner-workspace-count">{company.candidate_count || 0} candidates</span><StatusBadge status={company.status} /></td>
              <td>{dateLabel(company.created_at)}</td>
              <td><div className="owner-actions"><button type="button" className="owner-row-action" onClick={() => onEdit(company)}>Manage</button>{company.status !== 'deleted' && <><button type="button" className="owner-row-action" onClick={() => onToggle(company, company.status === 'active' ? 'suspended' : 'active')}>{company.status === 'active' ? 'Suspend' : 'Activate'}</button><button type="button" className="owner-row-action is-danger" onClick={() => onDelete(company)}>Delete</button></>}</div></td>
            </tr>
          ))}</tbody>
        </table>
        {!companies.length && <p className="owner-empty">No matching company accounts.</p>}
      </div>
    </section>
  );
}

function UserList({ companies, onEdit }) {
  return (
    <section className="owner-panel">
      <div className="owner-panel-heading"><div><h2>Company HR accounts</h2><p>Each company has its own assigned HR account and permission set.</p></div></div>
      <div className="owner-table-wrap"><table className="owner-table">
        <thead><tr><th>HR user</th><th>Company</th><th>Access</th><th>Last active</th><th /></tr></thead>
        <tbody>{companies.map((company) => (
          <tr key={company.company_id}>
            <td><span className="owner-user-cell"><strong>{company.hr_user?.name || company.hr_user?.username || 'No HR user'}</strong><small>{company.hr_user?.username || ''}</small></span></td>
            <td>{company.name}</td><td><StatusBadge status={company.hr_user?.active ? 'active' : 'suspended'} /></td><td>{timeLabel(company.hr_user?.last_active_at || company.hr_user?.last_login_at)}</td>
            <td><button type="button" className="owner-row-action" onClick={() => onEdit(company)}>Manage access</button></td>
          </tr>
        ))}</tbody>
      </table>{!companies.length && <p className="owner-empty">No company HR accounts yet.</p>}</div>
    </section>
  );
}

function ActivityList({ companies }) {
  const recent = companies.filter((company) => company.hr_user?.last_active_at || company.hr_user?.last_login_at)
    .sort((a, b) => new Date(b.hr_user.last_active_at || b.hr_user.last_login_at) - new Date(a.hr_user.last_active_at || a.hr_user.last_login_at));
  return (
    <section className="owner-panel">
      <div className="owner-panel-heading"><div><h2>Recent HR activity</h2><p>Most recent authenticated use by company account.</p></div><span className="owner-health-icon"><Activity size={18} /></span></div>
      {recent.length ? <div className="owner-activity-list">{recent.map((company) => (
        <article key={company.company_id} className="owner-activity-row"><span className="owner-activity-mark"><Users size={17} /></span><div><strong>{company.hr_user?.name || company.hr_user?.username} <span>accessed</span> {company.name}</strong><small>{company.hr_user?.username} · {company.status} workspace</small></div><time>{timeLabel(company.hr_user?.last_active_at || company.hr_user?.last_login_at)}</time></article>
      ))}</div> : <p className="owner-empty">No HR account sign-ins recorded yet.</p>}
    </section>
  );
}

function SystemSettingsForm({ settings, onChange, onSave, saving }) {
  return (
    <section className="owner-panel owner-settings-panel">
      <div className="owner-panel-heading"><div><h2>Platform configuration</h2><p>These settings apply across company workspaces.</p></div><Settings size={19} /></div>
      <form className="owner-settings-form" onSubmit={onSave}>
        <label className="owner-setting-row"><span><strong>Public job applications</strong><small>Allow candidates to submit applications through public company job links.</small></span><input type="checkbox" checked={settings.allow_public_applications} onChange={(event) => onChange({ ...settings, allow_public_applications: event.target.checked })} /></label>
        <label className="owner-setting-row owner-color-setting"><span><strong>Default company brand color</strong><small>Used as the initial brand color for new company job postings.</small></span><span className="owner-color-input"><input type="color" value={settings.default_brand_color} onChange={(event) => onChange({ ...settings, default_brand_color: event.target.value })} /><code>{settings.default_brand_color}</code></span></label>
        <div className="owner-settings-actions"><p>Changes are stored in the system database and apply immediately.</p><button type="submit" className="owner-primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save system settings'}</button></div>
      </form>
    </section>
  );
}

function CompanyModal({ company, createHrUser = false, onClose, onSave }) {
  const [name, setName] = useState(company?.name || '');
  const [hrUsername, setHrUsername] = useState(company?.hr_user?.username || '');
  const [hrName, setHrName] = useState(company?.hr_user?.name || '');
  const [hrEmail, setHrEmail] = useState(company?.hr_user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [active, setActive] = useState(company?.hr_user?.active ?? true);
  const [permissions, setPermissions] = useState(company?.hr_user?.permissions || PERMISSION_OPTIONS.map((item) => item.value));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(company);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) { setError('Enter a company name with at least two characters.'); return; }
    if (!/^[a-z0-9][a-z0-9._-]{2,39}$/i.test(hrUsername.trim())) { setError('HR username must be 3–40 letters, numbers, dots, underscores, or hyphens.'); return; }
    if ((!editing || password) && password.length < 12) { setError('Use a password with at least 12 characters.'); return; }
    if (!editing && password !== confirmPassword) { setError('The password and confirmation do not match.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        hr_user: {
          username: hrUsername.trim(),
          name: hrName.trim(),
          email: hrEmail.trim(),
          password,
          active,
          permissions,
        },
      });
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this company.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="owner-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="owner-modal" role="dialog" aria-modal="true" aria-labelledby="company-modal-title">
        <div className="owner-modal-heading"><div><p className="owner-eyebrow">{editing ? 'COMPANY ADMINISTRATION' : createHrUser ? 'NEW HR ACCOUNT' : 'NEW WORKSPACE'}</p><h2 id="company-modal-title">{editing ? 'Manage company account' : createHrUser ? 'Create HR user' : 'Create company workspace'}</h2><p>{editing ? 'Update the workspace, HR credentials, or granted access.' : 'Enter a company name and assign its HR username and password. The HR account is scoped to this company workspace.'}</p></div><button type="button" className="owner-icon-button" aria-label="Close" onClick={onClose}><X size={19} /></button></div>
        <form className="owner-company-form" onSubmit={handleSubmit}>
          <label>Company name<input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} /></label>
          <div className="owner-form-section-title"><Users size={16} /> HR user account</div>
          <label>HR full name<input value={hrName} onChange={(event) => setHrName(event.target.value)} required autoComplete="name" /></label>
          <label>HR username<input value={hrUsername} onChange={(event) => setHrUsername(event.target.value)} required autoComplete="off" /></label>
          <label>{editing ? 'Reset HR password (optional)' : 'HR password'}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required={!editing} minLength={12} maxLength={256} autoComplete="new-password" placeholder={editing ? 'Leave blank to keep current password' : 'At least 12 characters'} /></label>
          {!editing && <label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} maxLength={256} autoComplete="new-password" /></label>}
          {editing && <label>HR email<input type="email" value={hrEmail} onChange={(event) => setHrEmail(event.target.value)} autoComplete="email" /></label>}
          {editing && <label className="owner-access-toggle"><span>HR account access</span><select value={active ? 'active' : 'suspended'} onChange={(event) => setActive(event.target.value === 'active')}><option value="active">Active</option><option value="suspended">Suspended</option></select></label>}
          <fieldset className="owner-permissions"><legend>HR permissions</legend>{PERMISSION_OPTIONS.map((permission) => <label key={permission.value}><input type="checkbox" checked={permissions.includes(permission.value)} onChange={(event) => setPermissions((current) => event.target.checked ? [...current, permission.value] : current.filter((value) => value !== permission.value))} /><span>{permission.label}</span></label>)}</fieldset>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="owner-modal-actions"><button type="button" className="owner-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="owner-primary-button" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save account changes' : createHrUser ? 'Create HR user' : 'Create company account'}</button></div>
        </form>
      </section>
    </div>
  );
}

function StatusBadge({ status }) {
  const label = status === 'active' ? 'Active' : status === 'deleted' ? 'Deleted' : 'Suspended';
  return <span className={`owner-status-badge ${status === 'active' ? 'is-active' : status === 'deleted' ? 'is-deleted' : 'is-suspended'}`}><i />{label}</span>;
}

export default OwnerDashboard;
