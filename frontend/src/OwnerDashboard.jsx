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
  CircleCheck,
  LayoutDashboard,
  LogOut,
  Pause,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Download,
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
const currentDate = () => new Date();
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
  const [companyStatusFilter, setCompanyStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userCompanyFilter, setUserCompanyFilter] = useState('all');
  const [activityCompanyFilter, setActivityCompanyFilter] = useState('all');
  const [modalCompany, setModalCompany] = useState(null);
  const [pendingDeleteCompany, setPendingDeleteCompany] = useState(null);

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
  const visibleCompanies = useMemo(() => activeCompanies.filter((company) => {
    const matchesQuery = `${company.name} ${company.company_id} ${company.hr_user?.username || ''} ${company.hr_user?.name || ''} ${company.hr_user?.email || ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesStatus = companyStatusFilter === 'all' || company.status === companyStatusFilter;
    return matchesQuery && matchesStatus;
  }), [activeCompanies, companyStatusFilter, query]);
  const visibleHrCompanies = useMemo(() => activeCompanies.filter((company) => {
    if (!company.hr_user) return false;
    const matchesSearch = `${company.hr_user.name || ''} ${company.hr_user.username || ''} ${company.hr_user.email || ''} ${company.name}`
      .toLowerCase()
      .includes(userSearch.trim().toLowerCase());
    return matchesSearch && (userCompanyFilter === 'all' || company.company_id === userCompanyFilter);
  }), [activeCompanies, userCompanyFilter, userSearch]);

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

  const deleteCompany = async () => {
    if (!pendingDeleteCompany) return;
    const company = pendingDeleteCompany;
    setError('');
    setNotice('');
    try {
      await axios.delete(`${API_URL}/owner/companies/${company.company_id}`, { withCredentials: true });
      setPendingDeleteCompany(null);
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
    dashboard: ['System overview', 'Company workspaces and recruiting activity across the platform.'],
    companies: ['Company accounts', 'Create, update, suspend, activate, or delete isolated company workspaces.'],
    users: ['HR users & permissions', 'Manage company credentials, account access, and role permissions.'],
    activity: ['Recent activity', 'Review the latest recorded HR account activity across company workspaces.'],
    settings: ['System settings', 'Manage public applications and the default company brand color.'],
  };

  return (
    <div className="owner-shell">
      <aside className="owner-sidebar">
        <div className="owner-brand">
          <a className="owner-brand-link" href="/owner" aria-label="CV Screening system overview">
            <svg width="30" height="22" viewBox="0 0 200 120" aria-hidden="true"><path d="M87.6 32.4 A39 39 0 1 0 87.6 87.6" fill="none" stroke="#8e8cff" strokeWidth="22" /><polygon points="96,10 120,10 146,78.4 172,10 196,10 158,110 134,110" fill="#8e8cff" /></svg>
            <span><strong>CV Screening</strong><small>SYSTEM ADMIN</small></span>
          </a>
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
          <div className="owner-breadcrumb"><span>System</span><ChevronRight size={14} /><strong>{section === 'dashboard' ? 'Overview' : navItems.find((item) => item.id === section)?.label}</strong></div>
          <div className="owner-topbar-meta"><span className="owner-access-pill"><ShieldCheck size={14} aria-hidden="true" />Owner access</span><span className="owner-date">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span><button type="button" className="owner-topbar-logout" aria-label="Sign out" onClick={logout}><LogOut size={17} aria-hidden="true" /></button></div>
        </header>
        <div className="owner-content">
          <div className="owner-page-heading">
            <div><p className="owner-eyebrow">SYSTEM ADMINISTRATION</p><h1>{section === 'dashboard' ? 'System overview' : titles[section][0]}</h1><p>{titles[section][1]}</p></div>
            {(section === 'companies' || section === 'dashboard') && <button className="owner-primary-button" type="button" onClick={() => setModalCompany({})}><Plus size={17} /> Create company</button>}
            {section === 'users' && <button className="owner-primary-button" type="button" onClick={() => setModalCompany({ createHrUser: true })}><Plus size={17} /> Create HR user</button>}
          </div>
          {error && <div className="owner-alert owner-alert-error" role="alert"><CircleAlert size={17} />{error}<button type="button" aria-label="Dismiss error" onClick={() => setError('')}><X size={16} /></button></div>}
          {notice && <div className="owner-alert owner-alert-success" role="status"><Check size={17} />{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16} /></button></div>}
          {loading ? <div className="owner-empty" role="status">Loading system data…</div> : (
            <>
              {section === 'dashboard' && <DashboardOverview stats={stats} companies={activeCompanies} onViewCompanies={() => setSection('companies')} onEditCompany={setModalCompany} />}
              {section === 'companies' && (
                <CompanyList companies={visibleCompanies} query={query} onQuery={setQuery} statusFilter={companyStatusFilter} onStatusFilter={setCompanyStatusFilter} onEdit={setModalCompany} onToggle={updateCompanyStatus} onDelete={setPendingDeleteCompany} />
              )}
              {section === 'users' && <UserList companies={visibleHrCompanies} allCompanies={activeCompanies} query={userSearch} onQuery={setUserSearch} companyFilter={userCompanyFilter} onCompanyFilter={setUserCompanyFilter} onEdit={setModalCompany} />}
              {section === 'activity' && <ActivityList companies={activeCompanies} companyFilter={activityCompanyFilter} onCompanyFilter={setActivityCompanyFilter} />}
              {section === 'settings' && <SystemSettingsForm settings={settings} onChange={setSettings} onSave={saveSettings} saving={savingSettings} />}
            </>
          )}
        </div>
      </main>
      {modalCompany && <CompanyModal company={modalCompany.company_id ? modalCompany : null} createHrUser={modalCompany.createHrUser} onClose={() => setModalCompany(null)} onSave={saveCompany} />}
      {pendingDeleteCompany && <CompanyDeleteModal company={pendingDeleteCompany} onClose={() => setPendingDeleteCompany(null)} onConfirm={deleteCompany} />}
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
          <div className="owner-panel-heading"><div><h2>Company workspaces</h2><p>Newest first</p></div><button type="button" className="owner-text-button" onClick={onViewCompanies}>View all</button></div>
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
          <p className="owner-company-table-note">New companies appear here as soon as you create them.</p>
        </div>
        <div className="owner-panel owner-health-panel">
          <div className="owner-panel-heading"><div><h2>Workspace health</h2><p>Account status summary</p></div><span className="owner-health-icon"><Activity size={18} /></span></div>
          <div className="owner-health-total"><strong>{stats.active_companies || 0}</strong><span>of {stats.companies || 0} workspaces active</span></div>
          <div className="owner-health-bar"><span style={{ width: `${stats.companies ? Math.min((stats.active_companies / stats.companies) * 100, 100) : 0}%` }} /></div>
          <div className="owner-health-legend"><span><i className="is-active" /> Active <strong>{stats.active_companies || 0}</strong></span><span><i className="is-suspended" /> Suspended <strong>{stats.suspended_companies || 0}</strong></span></div>
          <div className="owner-health-note"><ShieldCheck size={16} /><span>Company records are isolated by workspace. HR access is checked on every protected API request.</span></div>
        </div>
      </section>
    </div>
  );
}

function CompanyList({ companies, query, onQuery, statusFilter, onStatusFilter, onEdit, onToggle, onDelete }) {
  return (
    <section className="owner-panel owner-company-directory">
      <div className="owner-panel-heading owner-list-heading">
        <div><h2>Company directory</h2><p>Each company gets a private HR workspace and its own sign-in.</p></div>
        <div className="owner-company-filters">
          <label className="owner-search"><Search size={16} aria-hidden="true" /><input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search companies or HR users" aria-label="Search companies or HR users" /></label>
          <select className="owner-status-filter" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)} aria-label="Filter companies by status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>
      <div className="owner-table-wrap">
        <table className="owner-table">
          <thead><tr><th>Company</th><th>HR account</th><th>Workspace</th><th>Status</th><th>Created</th><th className="owner-actions-heading">Actions</th></tr></thead>
          <tbody>{companies.length ? companies.map((company) => (
            <tr key={company.company_id}>
              <td><span className="owner-company-cell"><span className="owner-company-initial">{company.name.slice(0, 1).toUpperCase()}</span><span><strong>{company.name}</strong><small className="owner-company-id">{company.company_id}</small></span></span></td>
              <td><span className="owner-user-cell"><strong>{company.hr_user?.username || 'No HR user'}</strong><small>{company.hr_user?.name || company.hr_user?.email || '—'}</small></span></td>
              <td className="owner-workspace-cell">{company.job_count || 0} jobs · {company.candidate_count || 0} candidates</td>
              <td><StatusBadge status={company.status} /></td>
              <td className="owner-company-date">{dateLabel(company.created_at)}</td>
              <td><div className="owner-actions"><button type="button" className="owner-row-action" onClick={() => onEdit(company)}>Manage</button><button type="button" className={`owner-row-action ${company.status === 'active' ? 'is-warning' : 'is-success'}`} onClick={() => onToggle(company, company.status === 'active' ? 'suspended' : 'active')}>{company.status === 'active' ? 'Suspend' : 'Activate'}</button><button type="button" className="owner-row-action is-danger" onClick={() => onDelete(company)}>Delete</button></div></td>
            </tr>
          )) : <tr><td className="owner-company-empty" colSpan="6">No matching company accounts.</td></tr>}</tbody>
        </table>
      </div>
      <p className="owner-company-table-note">Deleting asks you to confirm the company name. HR access is disabled; historical records are retained for audit purposes.</p>
    </section>
  );
}

function UserList({ companies, allCompanies, query, onQuery, companyFilter, onCompanyFilter, onEdit }) {
  return (
    <div className="owner-users-content">
      <section className="owner-panel owner-user-directory">
        <div className="owner-panel-heading owner-list-heading">
          <div><h2>Company HR accounts</h2><p>Each company has its own HR account and permission set.</p></div>
          <div className="owner-user-filters">
            <label className="owner-search"><Search size={16} aria-hidden="true" /><input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search by name or company" aria-label="Search HR users by name or company" /></label>
            <select className="owner-company-filter" value={companyFilter} onChange={(event) => onCompanyFilter(event.target.value)} aria-label="Filter HR users by company">
              <option value="all">All companies</option>
              {allCompanies.map((company) => <option value={company.company_id} key={company.company_id}>{company.name}</option>)}
            </select>
          </div>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead><tr><th>HR user</th><th>Company</th><th>Role</th><th>Access</th><th>Last active</th><th className="owner-user-actions-heading"><span className="owner-visually-hidden">Actions</span></th></tr></thead>
            <tbody>{companies.length ? companies.map((company) => {
              const { hr_user: hrUser } = company;
              const permissions = hrUser.permissions || [];
              const hasAllPermissions = PERMISSION_OPTIONS.every((permission) => permissions.includes(permission.value));
              const isRecruiter = permissions.includes('jobs:manage')
                && permissions.includes('candidates:manage')
                && !permissions.includes('settings:manage');
              const role = hasAllPermissions ? 'Workspace owner' : isRecruiter ? 'Recruiter' : permissions.length ? 'Custom access' : 'No permissions';
              const lastActive = hrUser.last_active_at || hrUser.last_login_at;
              return (
                <tr key={company.company_id}>
                  <td><span className="owner-user-cell owner-hr-user-cell"><span className="owner-hr-avatar">{(hrUser.name || hrUser.username || '?').slice(0, 2).toUpperCase()}</span><span><strong>{hrUser.name || hrUser.username}</strong><small>{hrUser.username}</small></span></span></td>
                  <td className="owner-hr-company">{company.name}</td>
                  <td><span className="owner-hr-role">{role}</span></td>
                  <td><HrAccessBadge active={hrUser.active} /></td>
                  <td className="owner-hr-last-active">{lastActive ? timeLabel(lastActive) : 'Never signed in'}</td>
                  <td><button type="button" className="owner-row-action" onClick={() => onEdit(company)}>Manage access</button></td>
                </tr>
              );
            }) : <tr><td className="owner-company-empty" colSpan="6">{allCompanies.length ? 'No HR users match your search or company filter.' : 'No company HR accounts yet.'}</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className="owner-role-guide" aria-label="HR access roles">
        <article><h2>Workspace owner</h2><p>Manages jobs, candidate screening, exports and company settings.</p></article>
        <article><h2>Recruiter</h2><p>Manages jobs and reviews candidates but cannot change workspace settings.</p></article>
        <article><h2>Disabled</h2><p>Cannot sign in. Past decisions remain in the audit trail.</p></article>
      </section>
    </div>
  );
}

function ActivityList({ companies, companyFilter, onCompanyFilter }) {
  const recent = companies
    .map((company) => {
      const timestamp = company.hr_user?.last_active_at || company.hr_user?.last_login_at;
      return { company, timestamp, date: timestamp ? new Date(timestamp) : null };
    })
    .filter(({ company, date }) => date && !Number.isNaN(date.getTime()) && (companyFilter === 'all' || company.company_id === companyFilter))
    .sort((a, b) => b.date - a.date);
  const groups = recent.reduce((result, item) => {
    const key = `${item.date.getFullYear()}-${item.date.getMonth()}-${item.date.getDate()}`;
    if (!result[key]) result[key] = { date: item.date, items: [] };
    result[key].items.push(item);
    return result;
  }, {});
  const today = currentDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const getDayLabel = (date) => {
    if (date.toDateString() === today.toDateString()) return `Today · ${dateLabel(date)}`;
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${dateLabel(date)}`;
    return dateLabel(date);
  };
  const exportActivity = () => {
    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [
      ['Activity', 'HR user', 'Username', 'Company', 'Workspace status', 'Timestamp'],
      ...recent.map(({ company, timestamp }) => [
        'Latest recorded HR account activity',
        company.hr_user.name || company.hr_user.username,
        company.hr_user.username,
        company.name,
        company.status,
        new Date(timestamp).toISOString(),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `hr-activity-${currentDate().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="owner-activity-page">
      <div className="owner-activity-toolbar">
        <label htmlFor="owner-activity-company">Company
          <select id="owner-activity-company" value={companyFilter} onChange={(event) => onCompanyFilter(event.target.value)}>
            <option value="all">All companies</option>
            {companies.map((company) => <option value={company.company_id} key={company.company_id}>{company.name}</option>)}
          </select>
        </label>
        <button type="button" className="owner-secondary-button" onClick={exportActivity} disabled={!recent.length}><Download size={15} aria-hidden="true" /> Export log</button>
      </div>
      <section className="owner-panel owner-activity-panel">
        <div className="owner-panel-heading"><div><h2>Activity log</h2><p>Latest recorded activity timestamp for each HR account.</p></div><span className="owner-health-icon"><Activity size={18} /></span></div>
        {recent.length ? Object.entries(groups).map(([key, group]) => (
          <div key={key}>
            <h3 className="owner-activity-day">{getDayLabel(group.date)}</h3>
            <div className="owner-activity-list">{group.items.map(({ company, timestamp }) => (
              <article key={company.company_id} className="owner-activity-row">
                <span className="owner-activity-mark"><Activity size={17} aria-hidden="true" /></span>
                <div><strong>{company.hr_user?.name || company.hr_user?.username} <span>was active in</span> {company.name}</strong><small>{company.hr_user?.username} · {company.status} workspace</small></div>
                <time dateTime={new Date(timestamp).toISOString()}>{new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time>
              </article>
            ))}</div>
          </div>
        )) : <p className="owner-empty">{companyFilter === 'all' ? 'No HR account activity has been recorded yet.' : 'No HR account activity is recorded for this company.'}</p>}
        <p className="owner-activity-note">Only each account&apos;s latest activity timestamp is available; a historical event log is not currently retained.</p>
      </section>
    </div>
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

function CompanyDeleteModal({ company, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState('');
  const matchesCompanyName = confirmation.trim() === company.name;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (matchesCompanyName) onConfirm();
  };

  return (
    <div className="owner-modal-backdrop">
      <section className="owner-modal owner-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-company-title" aria-describedby="delete-company-description">
        <div className="owner-modal-heading">
          <div className="owner-delete-icon"><CircleAlert size={20} aria-hidden="true" /></div>
          <button type="button" className="owner-modal-close" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
        </div>
        <h2 id="delete-company-title">Delete {company.name}?</h2>
        <p id="delete-company-description">This disables the company&apos;s HR access. Historical records are retained for audit purposes. Type the company name to confirm.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="delete-company-confirmation">Company name</label>
          <input id="delete-company-confirmation" autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          <div className="owner-modal-actions">
            <button type="button" className="owner-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="owner-danger-button" disabled={!matchesCompanyName}>Delete company</button>
          </div>
        </form>
      </section>
    </div>
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
    if ((!editing || password) && password.length < 6) { setError('Use a password with at least 6 characters.'); return; }
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
          <label>{editing ? 'Reset HR password (optional)' : 'HR password'}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required={!editing} minLength={6} maxLength={256} autoComplete="new-password" placeholder={editing ? 'Leave blank to keep current password' : 'At least 6 characters'} /></label>
          {!editing && <label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} maxLength={256} autoComplete="new-password" /></label>}
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
  const Icon = status === 'active' ? CircleCheck : status === 'deleted' ? CircleAlert : Pause;
  return <span className={`owner-status-badge ${status === 'active' ? 'is-active' : status === 'deleted' ? 'is-deleted' : 'is-suspended'}`}><Icon size={13} aria-hidden="true" />{label}</span>;
}

function HrAccessBadge({ active }) {
  const Icon = active ? CircleCheck : Pause;
  return <span className={`owner-hr-access ${active ? 'is-active' : 'is-disabled'}`}><Icon size={13} aria-hidden="true" />{active ? 'Active' : 'Disabled'}</span>;
}

export default OwnerDashboard;
