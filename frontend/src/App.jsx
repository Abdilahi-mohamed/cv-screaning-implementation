import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Archive, BriefcaseBusiness, CalendarDays, ClipboardCheck, LayoutDashboard, Link2, Settings as SettingsIcon, Users } from 'lucide-react';
import HRLoginPage from './HRLoginPage.jsx';
import OwnerDashboard from './OwnerDashboard.jsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';
axios.defaults.withCredentials = true;
axios.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) {
    const requestUrl = String(error.config?.url || '');
    const isLoginRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/me');
    if (!isLoginRequest && window.location.pathname.startsWith('/owner') && requestUrl.includes('/owner/')) {
      window.location.replace('/owner');
    } else if (!isLoginRequest && !window.location.pathname.startsWith('/owner')
      && !window.location.pathname.startsWith('/apply')
      && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }
  return Promise.reject(error);
});
const resolveApiAssetUrl = (url) => {
  if (!url || /^https?:\/\//i.test(url)) return url;
  const base = API_URL.replace(/\/+$/, '');
  const path = url.startsWith('/api/') ? url.slice(4) : url;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};
const APP_THEMES = [
  {
    id: 'obsidian',
    name: 'Obsidian + Emerald',
    description: 'Emerald AI workspace',
    primary: '#34D399',
    swatches: ['#0C0F0D', '#171D19', '#34D399', '#D1FAE5'],
  },
  {
    id: 'midnight',
    name: 'Midnight + Violet',
    description: 'AI and innovation',
    primary: '#8B5CF6',
    swatches: ['#0B0914', '#19142A', '#8B5CF6', '#C4B5FD'],
  },
  {
    id: 'ivory',
    name: 'Warm Ivory + Forest',
    description: 'Luxury corporate',
    primary: '#174C3C',
    swatches: ['#F5F2EA', '#FFFFFF', '#174C3C', '#B6D8C5'],
  },
];
const defaultApplicationFields = [
  { id: 'candidate_name', key: 'candidate_name', label: 'Full name', type: 'text', required: true, locked: true },
  { id: 'candidate_email', key: 'candidate_email', label: 'Email address', type: 'email', required: true, locked: true },
  { id: 'candidate_phone', key: 'candidate_phone', label: 'Phone number', type: 'tel', required: true },
  { id: 'candidate_linkedin', key: 'candidate_linkedin', label: 'LinkedIn profile', type: 'url', required: false },
  { id: 'cv_file', key: 'cv_file', label: 'CV or resume', type: 'file', required: true, locked: true },
  { id: 'certificate_file', key: 'certificate_file', label: 'Certificate', type: 'file', required: true },
  { id: 'kur_file', key: 'kur_file', label: 'KUR image', type: 'file', required: true },
];

const sanitizeRichText = (html = '') => {
  const document = new DOMParser().parseFromString(String(html), 'text/html');
  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'H1', 'H2', 'H3', 'UL', 'OL', 'LI', 'A', 'SPAN', 'FONT']);
  const cleanNode = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowedTags.has(child.tagName)) {
          child.replaceWith(...child.childNodes);
          return;
        }
        [...child.attributes].forEach((attribute) => {
          if (attribute.name === 'style' && ['SPAN', 'FONT'].includes(child.tagName)) {
            const safeStyles = attribute.value.split(';').map((declaration) => declaration.trim()).filter((declaration) => {
              const separator = declaration.indexOf(':');
              if (separator < 0) return false;
              const property = declaration.slice(0, separator).trim().toLowerCase();
              const value = declaration.slice(separator + 1).trim();
              if (property === 'font-family') return /^[\w\s'",-]+$/.test(value);
              if (property === 'font-size') return /^[\d.]+(px|pt|em|rem|%)$/i.test(value);
              if (property === 'color') return /^(#[\da-f]{3,8}|[a-z]{3,20}|rgb(a)?\([\d.,%\s]+\))$/i.test(value);
              if (property === 'text-align') return /^(left|right|center|justify)$/i.test(value);
              return false;
            });
            if (safeStyles.length) child.setAttribute('style', safeStyles.join('; '));
            else child.removeAttribute('style');
            return;
          }
          const safeAttribute = (child.tagName === 'A' && attribute.name === 'href')
            || (child.tagName === 'FONT' && ['color', 'face', 'size'].includes(attribute.name));
          if (!safeAttribute) child.removeAttribute(attribute.name);
        });
        if (child.tagName === 'A') {
          try {
            if (!['http:', 'https:', 'mailto:'].includes(new URL(child.getAttribute('href'), window.location.origin).protocol)) {
              child.removeAttribute('href');
            }
          } catch {
            child.removeAttribute('href');
          }
        }
        cleanNode(child);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    });
  };
  cleanNode(document.body);
  return document.body.innerHTML;
};

const buttonClasses = {
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  green: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  red: 'bg-red-600 hover:bg-red-700 text-white',
  gray: 'bg-slate-200 hover:bg-slate-300 text-slate-700',
  purple: 'bg-violet-600 hover:bg-violet-700 text-white',
};

const statusColor = (status) => {
  if (status === 'shortlisted') return 'bg-emerald-100 text-emerald-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
};

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('cv-evolution-theme');
    const hasMigratedDefault = window.localStorage.getItem('cv-evolution-theme-default-migrated') === 'true';

    if (!hasMigratedDefault) {
      window.localStorage.setItem('cv-evolution-theme-default-migrated', 'true');
      if (savedTheme === 'midnight') return 'obsidian';
    }

    return APP_THEMES.some((option) => option.id === savedTheme) ? savedTheme : 'obsidian';
  });

  useEffect(() => {
    window.localStorage.setItem('cv-evolution-theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<HRLoginPage />} />
        <Route path="/owner/*" element={<OwnerDashboard />} />
        <Route path="/apply/:jobId" element={<PublicJobPage theme={theme} />} />
        <Route path="/apply/:jobId/form" element={<PublicJobPage theme={theme} />} />
        <Route path="*" element={<HRProtectedApp theme={theme} setTheme={setTheme} />} />
      </Routes>
    </BrowserRouter>
  );
}

function HRProtectedApp({ theme, setTheme }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/auth/me`)
      .then((response) => {
        if (!active) return;
        setUser(response.data.user);
        setError('');
      })
      .catch((requestError) => {
        if (!active) return;
        setUser(null);
        if (requestError.response?.status !== 401) {
          setError(requestError.response?.data?.message || 'Unable to verify the HR session.');
        } else {
          setError('');
        }
      })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [retryCount]);

  if (checking) return <div className="owner-loading" role="status">Verifying company access…</div>;
  if (error) {
    return <main className="auth-page"><section className="auth-card"><p className="auth-eyebrow">Company workspace</p><h1>Dashboard unavailable</h1><p className="auth-description" role="alert">{error}</p><button type="button" onClick={() => { setChecking(true); setRetryCount((count) => count + 1); }}>Retry connection</button></section></main>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <AppShell theme={theme} setTheme={setTheme} user={user} onLogout={() => setUser(null)} />;
}

function AppShell({ theme, setTheme, user, onLogout }) {
  const location = useLocation();
  const isRankingPage = location.pathname === '/rankings';
  const primaryBrandColor = APP_THEMES.find((option) => option.id === theme)?.primary || APP_THEMES[1].primary;
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [dashboard, setDashboard] = useState({
    stats: {
      total_candidates: 0,
      passed_filter: 0,
      evaluated: 0,
      shortlisted: 0,
      rejected: 0,
      pending_decision: 0,
    },
    top_candidates: [],
  });
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {});
      onLogout();
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Unable to end this session.');
    }
  };

  const selectedJob = useMemo(
    () => jobs.find((job) => job.job_id === selectedJobId) || jobs[0],
    [jobs, selectedJobId],
  );
  const navigation = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { label: 'New Jobs', icon: Link2, to: '/upload' },
    { label: 'Candidates', icon: Users, to: '/rankings' },
    { label: 'Screening Results', icon: ClipboardCheck, to: '/results' },
    { label: 'Analytics & Interviews', icon: BriefcaseBusiness, to: '/interview-questions' },
    { label: 'Settings', icon: SettingsIcon, to: '/settings' },
  ];
  useEffect(() => {
    let active = true;
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${API_URL}/jobs`);
        const savedJobs = Array.isArray(response.data) ? response.data : [];
        if (!active) return;
        setJobs(savedJobs);
        setSelectedJobId((prev) => savedJobs.some((job) => job.job_id === prev) ? prev : (savedJobs[0]?.job_id || ''));
      } catch (error) {
        if (!active) return;
        setJobs([]);
        setSelectedJobId('');
        setLoadError(error.response?.data?.message || 'Unable to load saved jobs. Check that the backend is running.');
      }
    };
    fetchJobs();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/jobs/${selectedJob.job_id}/dashboard`);
        setDashboard(response.data);
        setLoadError('');
      } catch (error) {
        setDashboard({
          job_id: selectedJob.job_id,
          title: selectedJob.title,
          stats: { total_candidates: 0, passed_filter: 0, evaluated: 0, shortlisted: 0, rejected: 0, pending_decision: 0 },
          top_candidates: [],
        });
        setLoadError(error.response?.data?.message || 'Unable to load the selected job dashboard.');
      }
    };

    fetchDashboard();
  }, [selectedJob]);

  const createJob = async (jobData) => {
    const response = await axios.post(`${API_URL}/jobs`, jobData);
    const newJob = response.data.job || {
      ...jobData,
      job_id: response.data.job_id,
    };
    setJobs((prev) => [newJob, ...prev]);
    setSelectedJobId(newJob.job_id);
    return response.data;
  };

  const saveFeedback = async ({ cv_id, decision, notes }) => {
    const response = await axios.post(`${API_URL}/feedback`, {
      cv_id,
      job_id: selectedJob?.job_id,
      decision,
      notes,
    });
    return response.data;
  };

  return (
    <div className="app-shell min-h-screen text-slate-800" data-theme={theme}>
      {loadError && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">{loadError}</p>}
      <header className="app-header sticky top-0 z-40">
        <div className="app-header-main mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="app-logo flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-slate-900">CV</div>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-none text-slate-900">TalentPulse</p>
              <p className="mt-1 truncate text-xs text-slate-500">{user.company_name || 'Company HR workspace'}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden max-w-64 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 sm:block">
              {selectedJob ? selectedJob.title : 'No job selected'}
            </div>
            <span className="hr-header-date hidden lg:inline-flex"><CalendarDays size={16} aria-hidden="true" />{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="hidden text-sm font-medium text-slate-700 md:block">{user.name || user.username}</span>
            <button type="button" className="hr-logout-button" onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="hr-workspace-layout">
        <aside className="hr-sidebar">
          <nav aria-label="Company navigation">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `hr-sidebar-link ${isActive ? 'is-active' : ''}`}>
                <item.icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="hr-sidebar-company"><span className="hr-sidebar-company-mark">{(user.company_name || 'C').slice(0, 1).toUpperCase()}</span><span><strong>{user.company_name}</strong><small>Private workspace</small></span></div>
        </aside>
        <div className={`app-layout mx-auto w-full ${isRankingPage ? 'ranking-layout' : 'max-w-6xl px-4 py-8 sm:px-6'}`}>
          <main className="app-main min-w-0">
            <Routes>
              <Route path="/" element={<DashboardPage dashboard={dashboard} jobs={jobs} selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} />} />
              <Route path="/new-job" element={<NewJobPage createJob={createJob} />} />
              <Route path="/job-requirements" element={<NewJobPage createJob={createJob} />} />
              <Route path="/upload" element={<JobLinkPage setSelectedJobId={setSelectedJobId} primaryBrandColor={primaryBrandColor} />} />
              <Route path="/rankings" element={<RankingsPage jobs={jobs} selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} saveFeedback={saveFeedback} />} />
              <Route path="/results" element={<ResultsPage jobs={jobs} selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} />} />
              <Route path="/interview-questions" element={<InterviewQuestionsPage jobs={jobs} selectedJobId={selectedJobId} setSelectedJobId={setSelectedJobId} />} />
              <Route path="/settings" element={<SettingsPage selectedJobId={selectedJobId} theme={theme} setTheme={setTheme} />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ dashboard, jobs, selectedJobId, setSelectedJobId }) {
  const navigate = useNavigate();
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('all');
  const visibleCandidates = (dashboard.top_candidates || []).filter((candidate) =>
    String(candidate.name || '').toLowerCase().includes(candidateSearch.trim().toLowerCase())
    && (candidateStatusFilter === 'all' || (candidate.status || 'evaluated') === candidateStatusFilter));
  const candidateTotal = Number(dashboard.stats.total_candidates) || 0;
  const pipelineSegments = [
    { label: 'Shortlisted', count: Number(dashboard.stats.shortlisted) || 0, color: 'var(--success)' },
    { label: 'Pending decision', count: Number(dashboard.stats.pending_decision) || 0, color: 'var(--warning)' },
    { label: 'Archived', count: Number(dashboard.stats.rejected) || 0, color: 'var(--error)' },
  ];

  return (
    <div className="app-page dashboard-page space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="page-header-eyebrow">Job pipeline</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-white">CV Screening Dashboard</h2>
          <p className="page-header-summary">Recruitment activity and candidate screening overview for your company workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedJobId || ''}
            onChange={(event) => setSelectedJobId(event.target.value)}
            aria-label="Active job"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200/10 bg-slate-900/60 px-4 py-3.5 text-base text-white shadow-inner shadow-slate-950/30 outline-none focus:border-blue-500 sm:flex-none"
          >
            {jobs.map((job) => (
              <option key={job.job_id} value={job.job_id}>{job.title}</option>
            ))}
          </select>
          <button type="button" onClick={() => navigate('/upload')} className="dashboard-primary-action shrink-0 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95">+ Create Job Link</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Total Candidates', value: dashboard.stats.total_candidates, tone: 'blue', icon: Users },
          { label: 'Screened', value: dashboard.stats.evaluated, tone: 'slate', icon: ClipboardCheck },
          { label: 'Shortlisted', value: dashboard.stats.shortlisted, tone: 'green', icon: BriefcaseBusiness },
          { label: 'Archived', value: dashboard.stats.rejected, tone: 'red', icon: Archive },
        ].map((card) => (
          <div key={card.label} className="metric-card relative min-h-32 overflow-hidden rounded-[22px] p-4 shadow-sm">
            <div className={`absolute -right-3 -top-3 grid h-16 w-16 place-items-center rounded-full ${card.tone === 'blue' ? 'bg-blue-500/15 text-blue-300' : card.tone === 'slate' ? 'bg-slate-500/10 text-slate-200' : card.tone === 'green' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
              <card.icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <p className="relative z-10 text-xs font-medium text-slate-300">{card.label}</p>
            <div className="relative z-10 mt-3 text-3xl font-semibold text-white">{card.value}</div>
            <p className="relative z-10 mt-1 text-xs text-slate-400">{card.tone === 'green' ? 'Ready for next round' : card.tone === 'red' ? 'Unmatched skills' : 'Candidates in pipeline'}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <section className="page-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Top candidates</h3>
              <p className="mt-1 text-sm text-slate-500">Highest evaluation scores for the selected job.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                aria-label="Search top candidates"
                placeholder="Search candidates"
                value={candidateSearch}
                onChange={(event) => setCandidateSearch(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:max-w-56"
              />
              <select
                aria-label="Filter top candidates by status"
                value={candidateStatusFilter}
                onChange={(event) => setCandidateStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="evaluated">Evaluated</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Archived</option>
              </select>
            </div>
          </div>
          {visibleCandidates.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">#</th>
                    <th scope="col" className="px-5 py-3 font-medium">Candidate</th>
                    <th scope="col" className="px-5 py-3 font-medium">Score</th>
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleCandidates.map((candidate, index) => (
                    <tr key={`${candidate.name}-${index}`}>
                      <td className="px-5 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{candidate.name}</td>
                      <td className="px-5 py-3 text-slate-600">{candidate.score ?? '—'}{candidate.score != null ? '/100' : ''}</td>
                      <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(candidate.status)}`}>{candidate.status || 'evaluated'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-500">{candidateSearch || candidateStatusFilter !== 'all' ? 'No candidates match these filters.' : 'Candidate evaluations will appear here when available.'}</p>
          )}
        </section>

        <section className="page-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Candidate pipeline</h3>
          <p className="mt-1 text-sm text-slate-500">Current decisions for this job.</p>
          <div className="mt-5 space-y-4">
            {pipelineSegments.map((segment) => (
              <div key={segment.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">{segment.label}</span>
                  <span className="font-semibold text-slate-900">{segment.count}</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={segment.label}
                  aria-valuemin={0}
                  aria-valuemax={Math.max(candidateTotal, 1)}
                  aria-valuenow={segment.count}
                >
                  <div className="h-full rounded-full" style={{ width: `${candidateTotal ? Math.min((segment.count / candidateTotal) * 100, 100) : 0}%`, backgroundColor: segment.color }} />
                </div>
              </div>
            ))}
            {!candidateTotal && <p className="text-xs text-slate-500">Pipeline metrics will appear after candidates apply.</p>}
          </div>
        </section>
      </div>

    </div>
  );
}

function NewJobPage({ createJob }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requiredExperience, setRequiredExperience] = useState('');
  const [educationRequirements, setEducationRequirements] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [otherRequirements, setOtherRequirements] = useState('');
  const [mustHave, setMustHave] = useState(['']);
  const [niceToHave, setNiceToHave] = useState([]);
  const [weights, setWeights] = useState({ skills: 40, experience: 30, education: 15, communication: 15 });
  const [cvFiles, setCvFiles] = useState([]);
  const [roleImage, setRoleImage] = useState(null);
  const [roleImagePreview, setRoleImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => () => {
    if (roleImagePreview) URL.revokeObjectURL(roleImagePreview);
  }, [roleImagePreview]);

  const updateList = (list, setList, index, value) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  const parseRequirements = (value) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const requiredSkills = mustHave.map((skill) => skill.trim()).filter(Boolean);
    if (!title.trim() || !responsibilities.trim() || !requiredSkills.length || !cvFiles.length) {
      setFormError('Enter the job title, responsibilities, at least one required skill, and upload at least one CV.');
      return;
    }
    const payload = {
      title: title.trim(),
      description: responsibilities.trim(),
      responsibilities: responsibilities.trim(),
      required_skills: requiredSkills,
      required_experience: requiredExperience.trim(),
      education_requirements: parseRequirements(educationRequirements),
      required_qualifications: parseRequirements(qualifications),
      other_requirements: parseRequirements(otherRequirements),
      rubric: {
        must_have: requiredSkills,
        nice_to_have: niceToHave.map((skill) => skill.trim()).filter(Boolean),
        weights,
      },
    };

    setFormError('');
    setSubmitting(true);
    try {
      const result = await createJob(payload);
      if (roleImage) {
        const imageData = new FormData();
        imageData.append('image', roleImage);
        await axios.post(`${API_URL}/jobs/${result.job_id}/image`, imageData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      navigate('/rankings', { state: { jobId: result.job_id, cvFiles, startProcessing: true } });
    } catch (error) {
      setFormError(error.response?.data?.message || 'Unable to save this job. Check that the backend is running.');
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page page-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Evaluation setup</span>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">Job Requirements</h2>
        <p className="mt-1 text-sm text-slate-500">Set the criteria candidates will be evaluated against, then upload the CVs for this role.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <label className="block text-sm font-medium text-slate-700">
            Job Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="Senior Software Developer" required />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Responsibilities
          <textarea value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} rows="4" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="Describe the role's key responsibilities." required />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Image Upload <span className="font-normal text-slate-500">(optional role image)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            onChange={(event) => {
              const image = event.target.files?.[0] || null;
              setRoleImage(image);
              setRoleImagePreview(image ? URL.createObjectURL(image) : '');
            }}
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm file:mr-4 file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700"
          />
          <span className="mt-1 block text-xs text-slate-500">Choose a JPEG, PNG, WebP, or GIF image (up to 5 MB). Images only; documents are not accepted here.</span>
          {roleImagePreview && <img src={roleImagePreview} alt="Selected role image preview" className="mt-3 h-24 w-40 rounded-lg border border-slate-200 object-cover" />}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Required experience
            <input value={requiredExperience} onChange={(e) => setRequiredExperience(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="For example, 5+ years in product engineering" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Education requirements
            <textarea value={educationRequirements} onChange={(e) => setEducationRequirements(e.target.value)} rows="2" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="One requirement per line or comma separated" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Required skills</h3>
            <div className="space-y-2">
              {mustHave.map((item, index) => (
                <div key={`must-${index}`} className="flex gap-2">
                  <input value={item} onChange={(e) => updateList(mustHave, setMustHave, index, e.target.value)} className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" />
                  <button type="button" onClick={() => setMustHave((prev) => prev.filter((_, i) => i !== index))} className="rounded-xl bg-red-600 px-3 py-2 text-white">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => setMustHave((prev) => [...prev, ''])} className={`${buttonClasses.gray} mt-2 rounded-lg px-3 py-2 text-sm font-medium`}>Add Skill</button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Preferred skills</h3>
            <div className="space-y-2">
              {niceToHave.map((item, index) => (
                <div key={`nice-${index}`} className="flex gap-2">
                  <input value={item} onChange={(e) => updateList(niceToHave, setNiceToHave, index, e.target.value)} className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" />
                  <button type="button" onClick={() => setNiceToHave((prev) => prev.filter((_, i) => i !== index))} className="rounded-xl bg-red-600 px-3 py-2 text-white">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => setNiceToHave((prev) => [...prev, ''])} className={`${buttonClasses.gray} mt-2 rounded-lg px-3 py-2 text-sm font-medium`}>Add Skill</button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Qualifications
            <textarea value={qualifications} onChange={(e) => setQualifications(e.target.value)} rows="3" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="Licenses, certifications, or other qualifications" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Other requirements
            <textarea value={otherRequirements} onChange={(e) => setOtherRequirements(e.target.value)} rows="3" className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500" placeholder="Additional role-specific criteria" />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Candidate CVs
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            required
            onChange={(event) => setCvFiles(Array.from(event.target.files || []))}
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm file:mr-4 file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700"
          />
          <span className="mt-1 block text-xs text-slate-500">Upload one or more text-readable PDF or Word CVs (up to 10 MB each).</span>
        </label>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Evaluation weights</h3>
          <div className="space-y-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                  <span>{key}</span>
                  <span>{value}%</span>
                </div>
                <input type="range" min="0" max="100" value={value} onChange={(e) => setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))} className="w-full accent-blue-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className={`${buttonClasses.blue} rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-60`}>
            {submitting ? 'Saving requirements...' : 'Submit to Ranking Page'}
          </button>
        </div>

        {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
      </form>
    </div>
  );
}

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const format = (command, commandValue) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || '');
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
        <select aria-label="Font" defaultValue="Arial" onChange={(event) => format('fontName', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
          {['Arial', 'Georgia', 'Times New Roman', 'Verdana', 'Tahoma'].map((font) => <option key={font}>{font}</option>)}
        </select>
        <select aria-label="Font size" defaultValue="3" onChange={(event) => format('fontSize', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
          <option value="2">Small</option><option value="3">Normal</option><option value="4">Large</option><option value="5">Very large</option>
        </select>
        {[['bold', 'B'], ['italic', 'I'], ['underline', 'U'], ['insertUnorderedList', '• List'], ['insertOrderedList', '1. List']].map(([command, label]) => (
          <button key={command} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format(command)} className="min-h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-700 hover:bg-blue-50" aria-label={command}>
            {label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Job description and requirements"
        aria-multiline="true"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="min-h-40 p-4 text-sm leading-6 text-slate-700 outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_ul]:list-disc [&_ol]:list-decimal"
      />
    </div>
  );
}

function JobLinkPage({ setSelectedJobId, primaryBrandColor }) {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [brandColor, setBrandColor] = useState(primaryBrandColor);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [applicationFields, setApplicationFields] = useState(defaultApplicationFields);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/jobs`)
      .then(({ data }) => {
        if (active) setJobs(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load saved jobs.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selectedJob = jobs.find((job) => job.job_id === jobId);
  const loadJobIntoEditor = (job) => {
    setTitle(job?.title || '');
    setDescription(job?.description || '');
    setCompanyName(job?.company_name || '');
    setBrandColor(/^#[0-9a-f]{6}$/i.test(job?.brand_color || '') ? job.brand_color : primaryBrandColor);
    setLogoPreview(job?.brand_logo_url || '');
    setLogoFile(null);
    setRequiredSkills((job?.required_skills || job?.rubric?.must_have || []).join('\n'));
    setQualifications((job?.required_qualifications || []).join('\n'));
    setApplicationFields(job?.application_fields?.length ? job.application_fields : defaultApplicationFields);
    setError('');
    setSuccess('');
    setCopied(false);
  };

  useEffect(() => () => {
    if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const jobPageLink = selectedJob
    ? new URL(`/apply/${encodeURIComponent(selectedJob.job_id)}`, window.location.origin).toString()
    : '';
  const applicationLink = selectedJob
    ? new URL(`/apply/${encodeURIComponent(selectedJob.job_id)}/form#application-form`, window.location.origin).toString()
    : '';

  const updateField = (fieldId, updates) => {
    setApplicationFields((fields) => fields.map((field) => field.id === fieldId ? { ...field, ...updates } : field));
  };

  const addField = (type) => {
    const id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setApplicationFields((fields) => [...fields, {
      id,
      key: id,
      label: type === 'file' ? 'Upload document' : type === 'image' ? 'Upload image' : type === 'number' ? 'Number' : 'Text answer',
      type,
      required: false,
      options: [],
    }]);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(applicationLink);
      setCopied(true);
      setError('');
    } catch {
      setError('Copy failed. Select the link and copy it manually.');
    }
  };

  const saveJob = async (event) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Enter a job title and description before saving.');
      return;
    }
    const fields = applicationFields.map(({ id, key, label, type, required, options }) => ({
      id, key, label: label.trim(), type, required: Boolean(required), options: options || [],
    }));
    if (fields.some((field) => !field.label)) {
      setError('Every application question needs a label.');
      return;
    }
    const skills = requiredSkills.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
    const qualificationList = qualifications.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
    const descriptionText = new DOMParser().parseFromString(description, 'text/html').body.textContent.trim();
    const payload = {
      title: title.trim(),
      description,
      responsibilities: descriptionText,
      company_name: companyName.trim(),
      brand_color: brandColor,
      application_fields: fields,
      required_skills: skills,
      required_qualifications: qualificationList,
      education_requirements: [],
      other_requirements: [],
      required_experience: '',
      rubric: {
        must_have: skills,
        nice_to_have: selectedJob?.rubric?.nice_to_have || [],
        weights: selectedJob?.rubric?.weights || { skills: 40, experience: 30, education: 15, communication: 15 },
      },
    };
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = selectedJob
        ? await axios.put(`${API_URL}/jobs/${selectedJob.job_id}`, payload)
        : await axios.post(`${API_URL}/jobs`, payload);
      let savedJob = response.data.job;
      if (logoFile) {
        const logoData = new FormData();
        logoData.append('image', logoFile);
        const logoResponse = await axios.post(`${API_URL}/jobs/${savedJob.job_id}/logo`, logoData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        savedJob = { ...savedJob, brand_logo_url: logoResponse.data.brand_logo_url };
      }
      setJobs((existing) => [savedJob, ...existing.filter((job) => job.job_id !== savedJob.job_id)]);
      setJobId(savedJob.job_id);
      setSelectedJobId(savedJob.job_id);
      window.dispatchEvent(new CustomEvent('cv-evolution:job-updated', { detail: { jobId: savedJob.job_id } }));
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('cv-evolution:job-updates');
        channel.postMessage(savedJob.job_id);
        channel.close();
      }
      setLogoFile(null);
      setSuccess('Job and application form saved. Share its link with candidates.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the job and application form.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-page space-y-6">
      <section className="page-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Job link builder</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Create your job application</h2>
          <p className="mt-1 text-sm text-slate-500">Write the job details, add your company branding, and build the candidate form in one place.</p>
        </div>

        {loading ? <p className="text-sm text-slate-500">Loading saved jobs...</p> : (
          <label className="mb-6 block max-w-xl text-sm font-semibold text-slate-700">
            Create or edit a job
            <select value={jobId} onChange={(event) => {
              const nextJobId = event.target.value;
              setJobId(nextJobId);
              loadJobIntoEditor(jobs.find((job) => job.job_id === nextJobId) || null);
            }} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-500">
              <option value="">Create a new job</option>
              {jobs.map((job) => <option key={job.job_id} value={job.job_id}>{job.title}</option>)}
            </select>
          </label>
        )}

        <form onSubmit={saveJob} className="space-y-7">
          <section className="company-branding-panel space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Company branding</h3>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                Brand color
                <input type="color" value={brandColor} onChange={(event) => setBrandColor(event.target.value)} aria-label="Company brand color" className="company-brand-color-picker" />
                <span className="font-mono uppercase">{brandColor}</span>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Company name
                <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="company-branding-control mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500" placeholder="Your company" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Company logo
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" onChange={(event) => {
                  const image = event.target.files?.[0] || null;
                  setLogoFile(image);
                  setLogoPreview(image ? URL.createObjectURL(image) : selectedJob?.brand_logo_url || '');
                }} className="company-branding-control mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700" />
                <span className="mt-1 block text-xs font-normal text-slate-500">JPEG, PNG, WebP or GIF (up to 5 MB).</span>
                {logoPreview && <img src={logoPreview} alt="Company logo preview" className="company-logo-preview mt-3 h-16 max-w-48 rounded-lg border border-slate-200 object-contain p-2" />}
              </label>
            </div>
          </section>

          <label className="block text-sm font-medium text-slate-700">
            Job title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="e.g. Human Resources Officer" />
          </label>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Job description and requirements</h3>
            <RichTextEditor value={description} onChange={setDescription} />
            <p className="mt-1 text-xs text-slate-500">Format your text using font, size, bold, italic and list tools.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Must-have skills <span className="font-normal text-slate-500">(one per line)</span>
              <textarea rows="4" value={requiredSkills} onChange={(event) => setRequiredSkills(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" placeholder={'Communication\\nMicrosoft Office'} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Qualifications or certificates <span className="font-normal text-slate-500">(one per line)</span>
              <textarea rows="4" value={qualifications} onChange={(event) => setQualifications(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" placeholder="Relevant degree or professional certificate" />
            </label>
          </div>

          <section className="space-y-4 border-t border-slate-200 pt-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Application form questions</h3>
              <p className="mt-1 text-sm text-slate-500">Choose what applicants need to enter or upload. Name, email and CV are required to submit an application.</p>
            </div>
            <div className="space-y-3">
              {applicationFields.map((field) => (
                <div key={field.id} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_150px_auto_auto] sm:items-center">
                  <input aria-label="Question label" value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
                  {field.type === 'select' && <input aria-label="Dropdown choices" value={(field.options || []).join(', ')} onChange={(event) => updateField(field.id, { options: event.target.value.split(',').map((option) => option.trim()).filter(Boolean) })} placeholder="Options, comma separated" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />}
                  {field.type !== 'select' && <span className="text-xs capitalize text-slate-500">{field.type === 'file' ? 'Document upload' : field.type === 'image' ? 'Image upload' : field.type === 'textarea' ? 'Long answer' : field.type}</span>}
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={Boolean(field.required)} disabled={['candidate_name', 'candidate_email', 'cv_file'].includes(field.key)} onChange={(event) => updateField(field.id, { required: event.target.checked })} />
                    Required
                  </label>
                  <button type="button" disabled={['candidate_name', 'candidate_email', 'cv_file'].includes(field.key)} onClick={() => setApplicationFields((fields) => fields.filter((item) => item.id !== field.id))} className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300">Remove</button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button type="button" onClick={() => addField('file')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">+ Upload document</button>
              <button type="button" onClick={() => addField('image')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">+ Upload image</button>
              <button type="button" onClick={() => addField('text')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">+ Text</button>
              <button type="button" onClick={() => addField('number')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">+ Number</button>
            </div>
          </section>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
          <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
            {saving ? 'Saving...' : selectedJob ? 'Save job and form' : 'Create job and form'}
          </button>
        </form>
      </section>

      {selectedJob && <section className="page-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h3 className="text-lg font-semibold text-slate-900">Share the application link</h3>
        <p className="mt-1 text-sm text-slate-500">Candidates can review the job details and company information before opening the application form.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input aria-label="Application link" readOnly value={applicationLink} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" />
          <button type="button" onClick={copyLink} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900" style={{ backgroundColor: primaryBrandColor }}>{copied ? 'Copied' : 'Copy link'}</button>
          <a href={jobPageLink} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Preview job page</a>
        </div>
      </section>}
    </div>
  );
}

function usePublicJob(jobId) {
  const [result, setResult] = useState({ jobId: '', job: null, loading: true, loadError: '' });

  useEffect(() => {
    let active = true;
    const refreshJob = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/jobs/${encodeURIComponent(jobId)}`);
        if (active) setResult({ jobId, job: data, loading: false, loadError: '' });
      } catch (requestError) {
        if (!active) return;
        setResult((previous) => ({
          jobId,
          job: previous.jobId === jobId ? previous.job : null,
          loading: false,
          loadError: requestError.response?.status === 404
            ? 'This job link is invalid or the job is no longer available.'
            : 'The job details could not load. Please try again later.',
        }));
      }
    };
    const handleJobUpdated = (event) => {
      if (event.detail?.jobId === jobId) refreshJob();
    };
    const handleFocus = () => refreshJob();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshJob();
    };
    let channel;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('cv-evolution:job-updates');
      channel.onmessage = (event) => {
        if (event.data === jobId) refreshJob();
      };
    }
    window.addEventListener('cv-evolution:job-updated', handleJobUpdated);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    refreshJob();

    return () => {
      active = false;
      channel?.close();
      window.removeEventListener('cv-evolution:job-updated', handleJobUpdated);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [jobId]);

  return result.jobId === jobId ? result : { job: null, loading: true, loadError: '' };
}

function PublicJobPage({ theme }) {
  const { jobId } = useParams();
  const location = useLocation();
  const { job, loading, loadError } = usePublicJob(jobId);
  const themeBrandColor = APP_THEMES.find((option) => option.id === theme)?.primary || APP_THEMES[1].primary;
  const brandColor = /^#[0-9a-f]{6}$/i.test(job?.brand_color || '') ? job.brand_color : themeBrandColor;
  const requirementSections = [
    { title: 'Required skills', items: job?.required_skills?.length ? job.required_skills : job?.rubric?.must_have || [] },
    { title: 'Qualifications', items: job?.required_qualifications || [] },
    { title: 'Education', items: job?.education_requirements || [] },
    { title: 'Other requirements', items: job?.other_requirements || [] },
  ].filter((section) => section.items.length);

  useEffect(() => {
    if (loading || !job || !location.pathname.endsWith('/form')) return undefined;

    const animationFrame = window.requestAnimationFrame(() => {
      document.getElementById('application-form')?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [job, loading, location.pathname]);

  return (
    <main className="app-shell public-job-page min-h-screen px-4 py-8 sm:px-6 sm:py-12" data-theme={theme} style={{ '--brand-color': brandColor }}>
      <div className="mx-auto max-w-4xl">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading job details...</div>
        ) : job ? (
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-2" style={{ backgroundColor: brandColor }} />
            <div className="space-y-8 p-5 sm:p-8 lg:p-10">
              <header className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-6">
                {job.brand_logo_url
                  ? <img src={job.brand_logo_url} alt={`${job.company_name || 'Company'} logo`} className="h-16 max-w-48 rounded-lg object-contain" />
                  : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-xl font-bold text-slate-900" style={{ backgroundColor: brandColor }}>{(job.company_name || 'C').slice(0, 1).toUpperCase()}</span>}
                <div>
                  <p className="text-base font-semibold text-slate-900">{job.company_name || 'Company'}</p>
                  <p className="mt-1 text-sm text-slate-500">Career opportunity</p>
                </div>
              </header>

              <section>
                <p className="text-sm font-semibold" style={{ color: brandColor }}>NOW HIRING</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{job.title}</h1>
              </section>

              {job.image_url && <img src={job.image_url} alt="" className="max-h-96 w-full rounded-xl border border-slate-200 object-cover" />}

              <section>
                <h2 className="text-xl font-semibold text-slate-900">Job description</h2>
                <div className="rich-description public-job-description mt-3 text-sm leading-6 text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizeRichText(job.description) }} />
              </section>

              {job.required_experience && (
                <section>
                  <h2 className="text-xl font-semibold text-slate-900">Experience</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{job.required_experience}</p>
                </section>
              )}

              {requirementSections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-slate-600">
                    {section.items.map((item, index) => <li key={`${section.title}-${index}`}>{item}</li>)}
                  </ul>
                </section>
              ))}

              <footer className="border-t border-slate-100 pt-6">
                <p className="mb-4 text-sm text-slate-600">Interested in this role? Complete the application form below.</p>
                <a href="#application-form" className="block w-full rounded-lg px-5 py-3 text-center text-sm font-semibold text-slate-900 transition hover:opacity-90 sm:ml-auto sm:w-auto" style={{ backgroundColor: brandColor }}>
                  Go to application form
                </a>
              </footer>
              <ApplicationFormPage key={jobId} job={job} jobId={jobId} brandColor={brandColor} />
            </div>
          </article>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Job unavailable</h1>
            <p role="alert" className="mt-2 text-sm text-slate-600">{loadError}</p>
          </section>
        )}
      </div>
    </main>
  );
}

function ApplicationFormPage({ job, jobId, brandColor }) {
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const applicationFields = job.application_fields?.length ? job.application_fields : defaultApplicationFields;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const formData = new FormData(event.currentTarget);
    const cvFile = formData.get('cv_file');
    if (!cvFile || !(cvFile instanceof File) || cvFile.size === 0) {
      setFormError('Please attach your CV before submitting.');
      return;
    }

    formData.set('job_id', jobId);
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/cvs/${jobId}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
    } catch (error) {
      setFormError(error.response?.data?.message || 'Your application could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section id="application-form" className="public-application-success scroll-mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-2xl text-blue-600">✓</span>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Application received</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Thank you for applying to {job.title}. Your application has been sent for review.</p>
      </section>
    );
  }

  return (
    <section id="application-form" className="scroll-mt-6 border-t border-slate-200 pt-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Application form</h2>
        <p className="mt-1 text-sm text-slate-600">Complete the information requested by the employer.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {applicationFields.map((field) => {
          const commonClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
          return (
            <label key={field.id} className="block text-sm font-semibold text-slate-700">
              {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
              {field.type === 'file' || field.type === 'image' ? (
                <>
                  <input name={field.key} type="file" accept={field.type === 'image' || field.key === 'kur_file' ? 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif' : field.key === 'certificate_file' ? '.pdf,application/pdf' : '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'} required={Boolean(field.required)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-sm font-normal file:mr-4 file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:font-semibold file:text-blue-700" />
                  <span className="mt-1 block text-xs font-normal text-slate-500">{field.type === 'image' || field.key === 'kur_file' ? 'JPEG, PNG, WebP or GIF image.' : field.key === 'certificate_file' ? 'PDF only.' : 'PDF or Word document (.pdf, .doc, .docx).'}</span>
                </>
              ) : field.type === 'textarea' ? (
                <textarea name={field.key} required={Boolean(field.required)} rows="4" className={commonClass} />
              ) : field.type === 'select' ? (
                <select name={field.key} required={Boolean(field.required)} className={commonClass}>
                  <option value="">Select an option</option>
                  {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === 'checkbox' ? (
                <input name={field.key} type="checkbox" value="Yes" required={Boolean(field.required)} className="ml-2 h-4 w-4 rounded border-slate-300 align-middle" />
              ) : (
                <input name={field.key} type={['email', 'tel', 'url', 'number'].includes(field.type) ? field.type : 'text'} autoComplete={field.key === 'candidate_name' ? 'name' : field.key === 'candidate_email' ? 'email' : field.key === 'candidate_phone' ? 'tel' : undefined} required={Boolean(field.required)} className={commonClass} />
              )}
            </label>
          );
        })}

        {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-slate-900 hover:opacity-90 disabled:cursor-wait disabled:opacity-60 sm:w-auto" style={{ backgroundColor: brandColor }}>
          {submitting ? 'Submitting application...' : 'Submit application'}
        </button>
      </form>
    </section>
  );
}

function RankingsPage({ jobs, selectedJobId, saveFeedback, setSelectedJobId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const jobId = selectedJobId || jobs[0]?.job_id || '';
  const [ranking, setRanking] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeCandidateId, setActiveCandidateId] = useState('');
  const [activeDocumentType, setActiveDocumentType] = useState('');
  const [filter, setFilter] = useState('all');
  const [analysisFilter, setAnalysisFilter] = useState('all');
  const [candidateQuery, setCandidateQuery] = useState('');
  const [chatThreads, setChatThreads] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState('');
  const pendingChatPromptRef = useRef('');
  const [chatLoading, setChatLoading] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState('');
  const [chatError, setChatError] = useState('');
  const [loadedChatConversationId, setLoadedChatConversationId] = useState('');
  const [chatErrorCandidateId, setChatErrorCandidateId] = useState('');
  const [questionGenerationLoading, setQuestionGenerationLoading] = useState(false);
  const [questionGenerationError, setQuestionGenerationError] = useState('');
  const [questionGenerationSuccess, setQuestionGenerationSuccess] = useState('');
  const [deletingCandidateId, setDeletingCandidateId] = useState('');
  const [hasChosenJob, setHasChosenJob] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reranking, setReranking] = useState(false);
  const [error, setError] = useState('');
  const [processingStage, setProcessingStage] = useState(() => location.state?.startProcessing ? 'Uploading CVs...' : '');
  const [processingError, setProcessingError] = useState(() => {
    const { jobId: submittedJobId, cvFiles, startProcessing } = location.state || {};
    return startProcessing && (!submittedJobId || !cvFiles?.length)
      ? 'The submitted job requirements or CV files are missing. Return to Job Requirements and submit again.'
      : '';
  });
  const processStarted = useRef(false);
  const chatCandidateRef = useRef('');
  const activeConversationRef = useRef('');
  const chatMessagesEndRef = useRef(null);
  const sendChatMessageRef = useRef(null);

  useEffect(() => {
    const { jobId: submittedJobId, cvFiles, startProcessing } = location.state || {};
    if (!startProcessing || processStarted.current || !submittedJobId || !cvFiles?.length) return;
    processStarted.current = true;
    setSelectedJobId(submittedJobId);

    const processCandidates = async () => {
      try {
        setProcessingError('');
        setProcessingStage('Uploading CVs...');
        const formData = new FormData();
        cvFiles.forEach((file) => formData.append('cv_files', file));
        const uploadResponse = await axios.post(`${API_URL}/cvs/${submittedJobId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadResponse.data?.uploaded !== cvFiles.length) {
          throw new Error('Not all selected CVs were uploaded successfully.');
        }

        setProcessingStage('Analyzing CVs...');
        const analysisResponse = await axios.post(`${API_URL}/evaluations/${submittedJobId}/analyze`);
        const analyses = analysisResponse.data?.analyses;
        const analyzedIds = new Set(Array.isArray(analyses) ? analyses.map((candidate) => candidate.cv_id) : []);
        if (!Array.isArray(analyses) || analyses.length !== cvFiles.length || analyzedIds.size !== cvFiles.length) {
          throw new Error('CV analysis did not return a result for every uploaded CV.');
        }

        setProcessingStage('Matching candidates with job requirements...');
        const matchingResponse = await axios.post(`${API_URL}/evaluations/${submittedJobId}/match`);
        const matches = matchingResponse.data?.matches;
        if (!Array.isArray(matches) || matches.length !== analyzedIds.size || matches.some((candidate) => !analyzedIds.has(candidate.cv_id))) {
          throw new Error('Candidate matching did not return a result for every analyzed CV.');
        }

        setProcessingStage('Ranking candidates...');
        const rankingResponse = await axios.get(`${API_URL}/jobs/${submittedJobId}/ranking`);
        const initialRanking = rankingResponse.data?.ranking;
        if (!Array.isArray(initialRanking) || initialRanking.length !== analyzedIds.size || initialRanking.some((candidate) => !analyzedIds.has(candidate.cv_id))) {
          throw new Error('Candidate ranking did not include every analyzed CV.');
        }

        setProcessingStage('Generating interview questions...');
        const questionsResponse = await axios.post(`${API_URL}/evaluations/${submittedJobId}/questions`);
        const generatedQuestions = questionsResponse.data?.interview_questions;
        if (!Array.isArray(generatedQuestions) || generatedQuestions.length !== analyzedIds.size ||
            generatedQuestions.some((candidate) => !analyzedIds.has(candidate.cv_id) || !candidate.questions?.length || candidate.questions.length > 10)) {
          throw new Error('Interview question generation did not return up to ten questions for every analyzed CV.');
        }

        setProcessingStage('Preparing final results...');
        const finalResponse = await axios.get(`${API_URL}/jobs/${submittedJobId}/ranking`);
        const finalRanking = finalResponse.data?.ranking;
        if (!Array.isArray(finalRanking) || finalRanking.length !== analyzedIds.size ||
            finalRanking.some((candidate) => !analyzedIds.has(candidate.cv_id) || !candidate.questions?.length || candidate.questions.length > 10)) {
          throw new Error('Final results are incomplete. Candidate rankings and interview questions must both be available.');
        }
        setRanking(finalRanking);
        navigate('/results', { replace: true, state: { jobId: submittedJobId, ranking: finalRanking } });
      } catch (requestError) {
        setProcessingError(requestError.response?.data?.message || requestError.message || 'CV processing failed. Please try again.');
      } finally {
        setProcessingStage('');
      }
    };
    processCandidates();
  }, [location.state, navigate, setSelectedJobId]);

  useEffect(() => {
    if (location.state?.startProcessing) return;
    let active = true;
    const loadRanking = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/jobs/${jobId}/ranking`);
        const currentRanking = Array.isArray(response.data.ranking) ? response.data.ranking : [];
        if (active) setRanking(currentRanking);
        if (active && !hasChosenJob && currentRanking.length === 0) {
          const otherJobs = jobs.filter((job) => job.job_id !== jobId);
          const otherRankings = await Promise.all(otherJobs.map(async (job) => {
            const result = await axios.get(`${API_URL}/jobs/${job.job_id}/ranking`);
            return { job, ranking: Array.isArray(result.data.ranking) ? result.data.ranking : [] };
          }));
          const firstJobWithCandidates = otherRankings.find((result) => result.ranking.length > 0);
          if (active && firstJobWithCandidates) {
            setSelectedJobId(firstJobWithCandidates.job.job_id);
            return;
          }
        }
      } catch (requestError) {
        if (active) {
          setRanking([]);
          setError(requestError.response?.data?.message || 'Unable to load candidate rankings.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (jobId) loadRanking();
    return () => { active = false; };
  }, [jobId, location.state?.startProcessing, hasChosenJob, jobs, setSelectedJobId]);

  const visibleRows = ranking.filter((entry) => {
    const matchesStatus = filter === 'all' || entry.status === filter;
    const matchesAnalysis = analysisFilter === 'all' || entry.analysis_status === analysisFilter;
    const query = candidateQuery.trim().toLowerCase();
    const matchesQuery = !query || [entry.candidate_name, entry.email, entry.phone, entry.city]
      .some((value) => String(value || '').toLowerCase().includes(query));
    return matchesStatus && matchesAnalysis && matchesQuery;
  });
  const activeCandidate = visibleRows.find((candidate) => candidate.cv_id === activeCandidateId) || visibleRows[0];
  const activeDocument = activeCandidate?.documents?.[activeDocumentType];
  const selectCandidate = (candidateId) => {
    if (candidateId !== activeCandidate?.cv_id) {
      setChatThreads([]);
      setActiveConversationId('');
      setChatMessages([]);
      setChatDraft('');
      pendingChatPromptRef.current = '';
      setLoadedChatConversationId('');
    }
    setActiveCandidateId(candidateId);
  };

  useEffect(() => {
    if (!jobId || !activeCandidate?.cv_id) return undefined;
    let active = true;
    const candidateId = activeCandidate.cv_id;
    chatCandidateRef.current = candidateId;
    activeConversationRef.current = '';
    const loadConversations = async () => {
      try {
        const response = await axios.get(`${API_URL}/evaluations/${jobId}/candidates/${candidateId}/chats`);
        if (active && chatCandidateRef.current === candidateId) {
          const conversations = Array.isArray(response.data?.conversations) ? response.data.conversations : [];
          setChatThreads(conversations);
          const mostRecent = conversations[0];
          setActiveConversationId(mostRecent?.conversation_id || '');
          setChatError('');
        }
      } catch (requestError) {
        if (active && chatCandidateRef.current === candidateId) {
          setChatThreads([]);
          setActiveConversationId('');
          setChatError(requestError.response?.data?.message || 'Unable to load chat history for this candidate.');
          setChatErrorCandidateId(candidateId);
        }
      }
    };
    loadConversations();
    return () => { active = false; };
  }, [jobId, activeCandidate?.cv_id]);

  useEffect(() => {
    if (!jobId || !activeCandidate?.cv_id || !activeConversationId) {
      activeConversationRef.current = '';
      return undefined;
    }
    let active = true;
    const candidateId = activeCandidate.cv_id;
    const conversationId = activeConversationId;
    const contextKey = `${candidateId}:${conversationId}`;
    activeConversationRef.current = contextKey;
    const loadConversation = async () => {
      try {
        const response = await axios.get(`${API_URL}/evaluations/${jobId}/candidates/${candidateId}/chats/${conversationId}`);
        if (active && activeConversationRef.current === contextKey) {
          setChatMessages(Array.isArray(response.data?.messages) ? response.data.messages : []);
          setChatError('');
        }
      } catch (requestError) {
        if (active && activeConversationRef.current === contextKey) {
          setChatError(requestError.response?.data?.message || 'Unable to load this conversation.');
          setChatErrorCandidateId(candidateId);
        }
      } finally {
        if (active && activeConversationRef.current === contextKey) setLoadedChatConversationId(conversationId);
      }
    };
    loadConversation();
    return () => { active = false; };
  }, [jobId, activeCandidate?.cv_id, activeConversationId]);

  const createNewChat = async (initialPrompt = '') => {
    if (!activeCandidate?.cv_id || chatLoading || deletingConversationId) return;
    const candidateId = activeCandidate.cv_id;
    setChatLoading(true);
    setChatError('');
    setChatErrorCandidateId('');
    setLoadedChatConversationId('');
    setChatDraft(initialPrompt);
    pendingChatPromptRef.current = initialPrompt;
    try {
      const response = await axios.post(`${API_URL}/evaluations/${jobId}/candidates/${candidateId}/chats`);
      const conversation = response.data;
      setChatThreads((previous) => [{
        conversation_id: conversation.conversation_id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        message_count: 0,
        last_message: '',
      }, ...previous]);
      setActiveConversationId(conversation.conversation_id);
      setChatMessages([]);
    } catch (requestError) {
      pendingChatPromptRef.current = '';
      setChatError(requestError.response?.data?.message || 'Unable to create a new chat.');
      setChatErrorCandidateId(candidateId);
    } finally {
      setChatLoading(false);
    }
  };

  const selectConversation = (conversationId) => {
    if (chatLoading || conversationId === activeConversationId) return;
    activeConversationRef.current = '';
    setLoadedChatConversationId('');
    setChatMessages([]);
    setChatDraft('');
    pendingChatPromptRef.current = '';
    setChatError('');
    setActiveConversationId(conversationId);
  };

  const deleteConversation = async (thread) => {
    if (!activeCandidate?.cv_id || chatLoading || deletingConversationId) return;
    const approved = window.confirm(`Delete "${thread.title || 'this chat'}"? This conversation will be permanently removed.`);
    if (!approved) return;

    const candidateId = activeCandidate.cv_id;
    const conversationId = thread.conversation_id;
    setDeletingConversationId(conversationId);
    setChatError('');
    try {
      await axios.delete(`${API_URL}/evaluations/${jobId}/candidates/${candidateId}/chats/${conversationId}`);
      if (chatCandidateRef.current === candidateId) {
        const remainingThreads = chatThreads.filter((item) => item.conversation_id !== conversationId);
        setChatThreads(remainingThreads);
        if (activeConversationId === conversationId) {
          activeConversationRef.current = '';
          setLoadedChatConversationId('');
          setChatMessages([]);
          setChatDraft('');
          setActiveConversationId(remainingThreads[0]?.conversation_id || '');
        }
      }
    } catch (requestError) {
      if (chatCandidateRef.current === candidateId) {
        setChatError(requestError.response?.data?.message || 'Unable to delete this conversation.');
        setChatErrorCandidateId(candidateId);
      }
    } finally {
      setDeletingConversationId('');
    }
  };

  const sendChatMessage = async (event, messageOverride) => {
    event?.preventDefault();
    const message = (typeof messageOverride === 'string' ? messageOverride : chatDraft).trim();
    if (!message || !activeCandidate?.cv_id || !activeConversationId || chatLoading) return;
    const candidateId = activeCandidate.cv_id;
    const conversationId = activeConversationId;
    const contextKey = `${candidateId}:${conversationId}`;
    setChatLoading(true);
    setChatError('');
    setChatErrorCandidateId('');
    setChatDraft('');
    setChatMessages((previous) => [...previous, { role: 'user', content: message }]);
    try {
      const response = await axios.post(`${API_URL}/evaluations/${jobId}/candidates/${candidateId}/chats/${conversationId}`, { message });
      if (activeConversationRef.current === contextKey) {
        const messages = Array.isArray(response.data?.messages) ? response.data.messages : [];
        setChatMessages(messages);
        setChatThreads((previous) => previous.map((thread) => thread.conversation_id === conversationId
          ? { ...thread, title: thread.title === 'New conversation' ? message.slice(0, 64) : thread.title, last_message: messages[messages.length - 1]?.content || message, message_count: messages.length, updated_at: new Date().toISOString() }
          : thread).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
      }
    } catch (requestError) {
      if (activeConversationRef.current === contextKey) {
        setChatMessages((previous) => previous.slice(0, -1));
        setChatDraft(message);
        setChatError(requestError.response?.data?.message || 'The AI could not respond. Please try again.');
        setChatErrorCandidateId(candidateId);
      }
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    sendChatMessageRef.current = sendChatMessage;
  });

  useEffect(() => {
    if (!pendingChatPromptRef.current || !activeConversationId || loadedChatConversationId !== activeConversationId || chatLoading) return;
    const prompt = pendingChatPromptRef.current;
    pendingChatPromptRef.current = '';
    sendChatMessageRef.current?.(null, prompt);
  }, [activeConversationId, loadedChatConversationId, chatLoading]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeConversationId, chatMessages, chatLoading]);

  const deleteCandidate = async (candidate) => {
    const approved = window.confirm(`Permanently delete ${candidate.candidate_name}'s application, uploaded documents, analysis, interview questions, and chat history? This cannot be undone.`);
    if (!approved) return;
    setDeletingCandidateId(candidate.cv_id);
    setError('');
    try {
      const response = await axios.delete(`${API_URL}/cvs/${jobId}/candidates/${candidate.cv_id}`);
      setRanking((previous) => previous.filter((item) => item.cv_id !== candidate.cv_id));
      setActiveCandidateId((current) => current === candidate.cv_id ? '' : current);
      setChatThreads([]);
      setActiveConversationId('');
      setChatMessages([]);
      setLoadedChatConversationId('');
      setChatError('');
      if (response.data?.cleanup_pending) {
        setError(response.data.message || 'Candidate data was deleted but a document file could not be removed.');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this candidate and their records.');
    } finally {
      setDeletingCandidateId('');
    }
  };

  const generateCandidateQuestions = async () => {
    if (!activeCandidate?.cv_id || questionGenerationLoading || chatLoading || deletingConversationId) return;
    const candidateId = activeCandidate.cv_id;
    setQuestionGenerationLoading(true);
    setChatLoading(true);
    setQuestionGenerationError('');
    setQuestionGenerationSuccess('');
    setChatError('');
    try {
      let conversationId = activeConversationId;
      let newConversation = null;
      if (!conversationId) {
        const conversationResponse = await axios.post(`${API_URL}/evaluations/${jobId}/candidates/${candidateId}/chats`);
        newConversation = conversationResponse.data;
        conversationId = newConversation.conversation_id;
        if (!conversationId) throw new Error('A chat could not be created for these questions.');
      }
      const response = await axios.post(`${API_URL}/evaluations/${jobId}/candidates/${candidateId}/questions`, {
        conversation_id: conversationId,
      });
      const questions = Array.isArray(response.data?.questions) ? response.data.questions.slice(0, 10) : [];
      if (!questions.length) throw new Error('The AI did not return any interview questions.');
      setRanking((previous) => previous.map((item) => item.cv_id === candidateId ? { ...item, questions } : item));
      if (chatCandidateRef.current === candidateId && response.data.conversation_id) {
        const messages = Array.isArray(response.data.messages) ? response.data.messages : [];
        const lastMessage = messages[messages.length - 1];
        const updatedAt = new Date().toISOString();
        const conversationTitle = response.data.title || newConversation?.title || 'Interview questions';
        const existingConversation = chatThreads.find((thread) => thread.conversation_id === conversationId);
        activeConversationRef.current = `${candidateId}:${conversationId}`;
        setChatThreads((previous) => [{
          conversation_id: conversationId,
          title: conversationTitle,
          created_at: newConversation?.created_at || existingConversation?.created_at || updatedAt,
          updated_at: updatedAt,
          message_count: messages.length,
          last_message: lastMessage?.content || '',
        }, ...previous.filter((thread) => thread.conversation_id !== conversationId)]);
        setActiveConversationId(conversationId);
        setChatMessages(messages);
        setLoadedChatConversationId(conversationId);
        setChatDraft('');
      }
      setQuestionGenerationSuccess(`Saved ${questions.length} tailored interview questions and added them to chat history.`);
    } catch (requestError) {
      setQuestionGenerationError(requestError.response?.data?.message || requestError.message || 'Unable to generate interview questions.');
    } finally {
      setQuestionGenerationLoading(false);
      setChatLoading(false);
    }
  };

  const shortlist = async (cv_id) => {
    try {
      await saveFeedback({ cv_id, decision: 'shortlist', notes: 'Strong match for this role' });
      setRanking((prev) => prev.map((item) => item.cv_id === cv_id ? { ...item, status: 'shortlisted' } : item));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the candidate decision.');
    }
  };

  const reject = async (cv_id) => {
    try {
      await saveFeedback({ cv_id, decision: 'reject', notes: 'Needs closer match to requirements' });
      setRanking((prev) => prev.map((item) => item.cv_id === cv_id ? { ...item, status: 'rejected' } : item));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the candidate decision.');
    }
  };

  const rerankWithAI = async () => {
    setReranking(true);
    setError('');
    try {
      await axios.post(`${API_URL}/evaluations/${jobId}/analyze`);
      await axios.post(`${API_URL}/evaluations/${jobId}/match`);
      await axios.post(`${API_URL}/evaluations/${jobId}/questions`);
      const response = await axios.get(`${API_URL}/jobs/${jobId}/ranking`);
      if (!Array.isArray(response.data?.ranking)) {
        throw new Error('The AI ranking response is incomplete. Please try again.');
      }
      setRanking(response.data.ranking);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to rerun the AI candidate ranking.');
    } finally {
      setReranking(false);
    }
  };

  if (processingStage || processingError) {
    const stages = [
      'Uploading CVs...',
      'Analyzing CVs...',
      'Matching candidates with job requirements...',
      'Ranking candidates...',
      'Generating interview questions...',
      'Preparing final results...',
    ];
    const progressWidth = processingError
      ? '100%'
      : `${Math.max((stages.indexOf(processingStage) + 1) * 16, 8)}%`;

    return (
      <div className="app-page page-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <section className="mx-auto max-w-4xl rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8" aria-busy={Boolean(processingStage)}>
          <div className="flex items-start gap-4">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-xl text-blue-700 ${processingStage ? 'animate-pulse' : ''}`}>
              {processingError ? '!' : '↻'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Ranking Page · Live CV evaluation</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{processingError ? 'Processing needs attention' : processingStage}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {processingError || 'The submitted job requirements are being applied to the uploaded CVs. This page will stay open until analysis, matching, ranking, and candidate-specific questions are ready.'}
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all duration-500 ${processingError ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: progressWidth }} />
              </div>
            </div>
          </div>
          {processingError ? (
            <button type="button" onClick={() => navigate('/job-requirements')} className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Return to Job Requirements</button>
          ) : (
            <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stages.map((step, index) => {
                const activeIndex = stages.indexOf(processingStage);
                const completed = index < activeIndex;
                const active = index === activeIndex;
                return (
                  <li key={step} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${active ? 'bg-blue-50 text-blue-800' : 'bg-slate-50 text-slate-500'}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${completed ? 'bg-emerald-100 text-emerald-700' : active ? 'animate-pulse bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {completed ? '✓' : index + 1}
                    </span>
                    {step}
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-6 text-xs text-slate-400">Please keep this page open while the requested evaluation steps complete.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="app-page page-panel space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="page-header-eyebrow">Ranking workspace</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Candidate Rankings</h2>
          <p className="page-header-summary">AI-assisted benchmark against Senior Full Stack Engineer requirements and custom criteria.</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" className="mini-panel-button is-primary h-10 shrink-0 rounded-lg px-4 text-xs font-semibold tracking-wide uppercase hover:brightness-95">
            Export Shortlist
          </button>
          <button
            type="button"
            onClick={rerankWithAI}
            disabled={reranking || loading || !jobId || ranking.length === 0}
            className="mini-panel-button is-primary h-10 shrink-0 rounded-lg px-4 text-xs font-semibold tracking-wide uppercase hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
          >
            {reranking ? 'Analyzing…' : 'Run AI Evaluation'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <select value={jobId} onChange={(e) => {
          setHasChosenJob(true);
          setSelectedJobId(e.target.value);
          setActiveDocumentType('');
          setChatThreads([]);
          setActiveConversationId('');
          setChatMessages([]);
          setLoadedChatConversationId('');
        }} className="rounded-xl border border-slate-300/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400">
          {jobs.map((job) => (
            <option key={job.job_id} value={job.job_id}>{job.title} · {job.job_id.slice(-4)}</option>
          ))}
        </select>
        <input
          type="search"
          value={candidateQuery}
          onChange={(event) => setCandidateQuery(event.target.value)}
          placeholder="Search candidates"
          aria-label="Search candidates"
          className="h-10 min-w-44 rounded-xl border border-slate-300/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-emerald-400"
        />
        <select value={filter} onChange={(e) => {
          setFilter(e.target.value);
          setActiveDocumentType('');
        }} className="rounded-xl border border-slate-300/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400">
          <option value="all">All</option>
          <option value="pending_decision">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={analysisFilter} onChange={(event) => setAnalysisFilter(event.target.value)} aria-label="Filter by AI analysis status" className="rounded-xl border border-slate-300/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400">
          <option value="all">All analysis</option>
          <option value="analyzed">Analyzed</option>
          <option value="not_analyzed">Needs analysis</option>
        </select>
      </div>

      {loading && <p role="status" className="text-sm text-slate-500">Loading candidate rankings...</p>}
      {reranking && <p role="status" className="text-sm text-slate-500">AI ayaa dib u falanqaynaya musharraxiinta...</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && visibleRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No analyzed candidates are available for this job yet. Submit requirements and CVs to begin the evaluation.</div>
      ) : visibleRows.length > 0 && (
        <div className="ranking-workspace grid min-h-[620px] gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="ranking-sidebar overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 px-4 py-4">
              <h3 className="font-semibold text-slate-900">Candidates</h3>
              <p className="mt-1 text-xs text-slate-500">{visibleRows.length} applicants · select a candidate to review their documents and AI context.</p>
            </div>
            <div className="ranking-sidebar-list space-y-2 overflow-y-auto p-3">
              {visibleRows.map((candidate) => {
                const isActive = activeCandidate?.cv_id === candidate.cv_id;
                return (
                  <div key={candidate.cv_id || candidate.email} aria-current={isActive ? 'true' : undefined} className={`ranking-candidate rounded-xl border p-3 transition ${isActive ? 'border-blue-200 bg-white shadow-sm' : 'border-transparent bg-transparent hover:bg-white'}`}>
                    <button type="button" onClick={() => {
                      selectCandidate(candidate.cv_id);
                      setActiveDocumentType('');
                    }} className="flex h-[52px] w-full items-center gap-3 text-left">
                      {candidate.documents?.profile?.url
                        ? <img src={candidate.documents.profile.url} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                        : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-700">{candidate.candidate_name?.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{candidate.candidate_name}</span>
                        <span className="block truncate text-xs text-slate-500">{candidate.score === null ? 'Not analyzed' : `#${candidate.rank} · ${candidate.score}/100`}</span>
                      </span>
                    </button>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        { type: 'cv', label: 'CV', icon: '📄' },
                        { type: 'certificate', label: 'Shahaado', icon: '🎓' },
                      ].map((document) => {
                        const available = Boolean(candidate.documents?.[document.type]?.url);
                        const selected = isActive && activeDocumentType === document.type;
                        return (
                          <button
                            key={document.type}
                            type="button"
                            disabled={!available}
                            aria-label={`${document.label} ${candidate.candidate_name}`}
                            aria-pressed={selected}
                            onClick={() => {
                              selectCandidate(candidate.cv_id);
                              setActiveDocumentType(document.type);
                            }}
                            className={`ranking-document-button h-9 w-full rounded-lg border px-2 text-xs font-medium transition ${selected ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'} disabled:cursor-not-allowed disabled:opacity-40`}
                            title={available ? candidate.documents[document.type].name : `${document.label} lama hayo`}
                          >
                            {document.icon} {document.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {activeCandidate && (
            <section className="ranking-document-panel min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-slate-900">{activeCandidate.candidate_name}</h3>
                  <p className="truncate text-sm text-slate-500">{activeCandidate.email}{activeCandidate.phone ? ` · ${activeCandidate.phone}` : ''}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
                    {activeCandidate.analysis_status === 'analyzed' ? 'AI analyzed' : 'Analysis needed'}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(activeCandidate.status)}`}>
                    {activeCandidate.status === 'pending_decision' ? 'Pending review' : activeCandidate.status}
                  </span>
                  <button type="button" onClick={() => setSelectedCandidate(activeCandidate)} className="h-9 w-28 shrink-0 rounded-lg bg-blue-50 px-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">View evaluation</button>
                  <button type="button" onClick={() => shortlist(activeCandidate.cv_id)} className="h-9 w-28 shrink-0 rounded-lg bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">Shortlist</button>
                  <button type="button" onClick={() => reject(activeCandidate.cv_id)} className="h-9 w-28 shrink-0 rounded-lg bg-red-50 px-2 text-xs font-semibold text-red-700 hover:bg-red-100">Reject</button>
                  <button type="button" onClick={() => deleteCandidate(activeCandidate)} disabled={deletingCandidateId === activeCandidate.cv_id} className="h-9 shrink-0 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 text-xs font-semibold text-rose-200 hover:bg-rose-400/20 disabled:opacity-50">{deletingCandidateId === activeCandidate.cv_id ? 'Deleting…' : 'Delete applicant'}</button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex gap-2">
                  {[
                    { type: 'cv', label: 'CV document' },
                    { type: 'certificate', label: 'Shahaadada' },
                  ].map((document) => (
                    <button key={document.type} type="button" disabled={!activeCandidate.documents?.[document.type]?.url} onClick={() => setActiveDocumentType(document.type)} className={`h-10 w-32 shrink-0 rounded-lg px-2 text-sm font-medium transition ${activeDocumentType === document.type ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'} disabled:cursor-not-allowed disabled:opacity-40`}>
                      {document.label}
                    </button>
                  ))}
                </div>
                {activeDocument?.url && <a href={resolveApiAssetUrl(activeDocument.url)} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 hover:underline">Ku fur tab cusub ↗</a>}
              </div>
              {activeDocument?.url ? (
                <div className="ranking-document-viewer min-h-[480px] bg-slate-100">
                  {activeDocument.mime_type === 'application/pdf' ? (
                    <iframe title={`${activeCandidate.candidate_name} ${activeDocumentType}`} src={activeDocument.url} className="h-[70vh] min-h-[480px] w-full" />
                  ) : (activeDocument.mime_type || '').startsWith('image/') ? (
                    <div className="flex min-h-[480px] justify-center p-4"><img src={activeDocument.url} alt={`${activeCandidate.candidate_name} ${activeDocumentType}`} className="max-h-[70vh] max-w-full object-contain" /></div>
                  ) : (
                    <div className="flex min-h-[480px] flex-col items-center justify-center gap-3 p-6 text-center">
                      <span className="text-4xl" aria-hidden="true">📄</span>
                      <p className="text-sm font-semibold text-slate-800">{activeDocument.name}</p>
                      <p className="max-w-md text-sm text-slate-500">Nooca Word-ka browser-kan si toos ah uguma soo bandhigi karo. Dukumentiga ku fur tab cusub ama soo dejiso.</p>
                      <a href={resolveApiAssetUrl(activeDocument.url)} target="_blank" rel="noreferrer" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Fur dukumentiga</a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[480px] items-center justify-center p-6 text-center text-sm text-slate-500">
                  {!activeDocumentType
                    ? 'Dhinaca ka dooro CV-ga ama shahaadada aad rabto inaad furto.'
                    : activeDocumentType === 'certificate'
                      ? 'Musharraxan ma soo gelin shahaado.'
                      : 'CV-ga musharraxan lama heli karo.'}
                </div>
              )}
              <div className="border-t border-slate-200 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-700">AI assessment</p>
                {activeCandidate.feedback && <p className="mb-3 rounded-xl bg-indigo-50 px-3 py-2 text-sm leading-relaxed text-slate-600">{activeCandidate.feedback}</p>}
                {!activeCandidate.feedback && <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">This applicant has not been analyzed yet. Run AI analysis to compare their submitted evidence with the selected role.</p>}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span>Overall match: <strong className="text-slate-800">{activeCandidate.score === null ? '—' : `${activeCandidate.score}/100`}</strong></span>
                  <span>Xirfado: <strong className="text-slate-800">{activeCandidate.details?.skills_score ?? '—'}</strong></span>
                  <span>Khibrad: <strong className="text-slate-800">{activeCandidate.details?.experience_score ?? '—'}</strong></span>
                  <span>Waxbarasho: <strong className="text-slate-800">{activeCandidate.details?.education_score ?? '—'}</strong></span>
                </div>
                {(activeCandidate.application_responses?.length > 0 || activeCandidate.application_documents?.length > 0) && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Codsiga la soo gudbiyey</p>
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {activeCandidate.application_responses?.map((response, index) => (
                        <div key={`${response.label}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">
                          <dt className="text-xs font-medium text-slate-500">{response.label}</dt>
                          <dd className="mt-1 break-words text-sm text-slate-800">{response.value || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                    {activeCandidate.application_documents?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activeCandidate.application_documents.map((document) => (
                          <a key={`${document.label}-${document.name}`} href={resolveApiAssetUrl(document.url)} target="_blank" rel="noreferrer" className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                            {document.label}: {document.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  {activeCandidate.city && <span>Location: <strong className="text-slate-200">{activeCandidate.city}</strong></span>}
                  {activeCandidate.uploaded_at && <span>Applied: <strong className="text-slate-200">{new Date(activeCandidate.uploaded_at).toLocaleDateString()}</strong></span>}
                  {activeCandidate.linkedin && <a href={activeCandidate.linkedin} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">LinkedIn profile ↗</a>}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {activeCandidate && (
        <section className="ranking-chat-panel overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300/20 to-violet-400/20 text-lg text-cyan-200">✦</span>
              <div>
                <h3 className="font-semibold text-slate-100">Recruitment AI</h3>
                <p className="text-xs text-slate-400">Context: {activeCandidate.candidate_name} · {jobs.find((job) => job.job_id === jobId)?.title || 'Selected role'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={generateCandidateQuestions} disabled={questionGenerationLoading || chatLoading || Boolean(deletingConversationId)} className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-50">{questionGenerationLoading ? 'Generating…' : '↻ Generate questions'}</button>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200">Candidate-scoped</span>
            </div>
          </div>
          <div className="grid min-h-[30rem] md:grid-cols-[17rem_minmax(0,1fr)]">
            <aside className="flex max-h-[20rem] flex-col border-b border-slate-700/70 bg-slate-950/35 p-4 md:max-h-[48rem] md:border-b-0 md:border-r" aria-label="Chat history">
              <button type="button" onClick={() => createNewChat()} disabled={chatLoading || Boolean(deletingConversationId)} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/15 disabled:opacity-50">
                <span aria-hidden="true">＋</span> New chat
              </button>
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Chat history</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">{activeCandidate.candidate_name}</p>
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-400">{chatThreads.length}</span>
              </div>
              {chatThreads.length ? (
                <div className="flex-1 space-y-1 overflow-y-auto pr-1">
                  {chatThreads.map((thread) => (
                    <div key={thread.conversation_id} className="group flex items-center gap-1 rounded-xl pr-1 hover:bg-slate-800/70">
                      <button type="button" onClick={() => selectConversation(thread.conversation_id)} disabled={chatLoading || Boolean(deletingConversationId)} aria-current={activeConversationId === thread.conversation_id ? 'true' : undefined} className="min-w-0 flex-1 rounded-xl border border-transparent p-3 text-left transition hover:border-slate-700/70 aria-[current=true]:border-cyan-300/30 aria-[current=true]:bg-cyan-300/10 disabled:cursor-wait">
                        <span className="block truncate text-sm font-medium text-slate-200">{thread.title || 'Previous conversation'}</span>
                        <span className="mt-1 block truncate text-xs text-slate-400">{thread.last_message || 'No messages yet'}</span>
                        <span className="mt-2 block text-[10px] text-slate-500">{thread.updated_at ? new Date(thread.updated_at).toLocaleDateString() : 'Just now'} · {thread.message_count || 0} messages</span>
                      </button>
                      <button type="button" onClick={() => deleteConversation(thread)} disabled={chatLoading || Boolean(deletingConversationId)} aria-label={`Delete chat: ${thread.title || 'Previous conversation'}`} title="Delete chat" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 opacity-100 transition hover:bg-rose-400/10 hover:text-rose-200 disabled:cursor-wait disabled:opacity-40 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100">{deletingConversationId === thread.conversation_id ? '…' : '×'}</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-700 px-3 py-4 text-xs leading-5 text-slate-400">No saved chats yet. Start a new chat to begin a conversation about this candidate.</p>
              )}
            </aside>
            <div className="min-w-0">
          {questionGenerationError && <p role="alert" className="mx-5 mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{questionGenerationError}</p>}
          {questionGenerationSuccess && <p role="status" className="mx-5 mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">{questionGenerationSuccess}</p>}
          {!activeConversationId && !chatLoading && (
            <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                'Analyze this candidate against the job requirements.',
                'What strengths are supported by the submitted evidence?',
                'Which requirements are not yet evidenced?',
                'Generate tailored interview questions for this candidate.',
              ].map((prompt) => (
                <button key={prompt} type="button" onClick={() => createNewChat(prompt)} className="min-h-12 rounded-xl border border-slate-700/70 bg-slate-800/70 px-3 py-2 text-left text-xs text-slate-300 hover:border-cyan-300/40 hover:bg-slate-800">{prompt}</button>
              ))}
            </div>
          )}
          <div className="max-h-80 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
            {(activeConversationId && loadedChatConversationId === activeConversationId ? chatMessages : []).map((message, index) => (
              <div key={`${message.role}-${message.created_at || index}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-3xl whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-cyan-300/15 text-cyan-50' : 'border border-slate-700/70 bg-slate-800/80 text-slate-200'}`}>{message.content}</p>
              </div>
            ))}
            {(chatLoading || (activeConversationId && loadedChatConversationId !== activeConversationId)) && <p role="status" className="text-sm text-slate-400">Recruitment AI is reviewing the selected job and candidate…</p>}
            <div ref={chatMessagesEndRef} />
          </div>
          {chatError && chatErrorCandidateId === activeCandidate.cv_id && <p role="alert" className="mx-5 mb-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{chatError}</p>}
          <form onSubmit={sendChatMessage} className="flex gap-3 border-t border-slate-700/70 p-4">
            <input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} maxLength={2000} placeholder={activeConversationId ? 'Ask about this candidate’s fit, evidence, or interview…' : 'Start a new chat to message the recruitment AI'} aria-label="Message the recruitment AI" disabled={!activeConversationId} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300/60 disabled:opacity-60" />
            <button type="submit" disabled={chatLoading || !chatDraft.trim() || !activeConversationId || loadedChatConversationId !== activeConversationId} className="rounded-xl bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{chatLoading ? 'Thinking…' : 'Send'}</button>
          </form>
          <p className="px-5 pb-4 text-[11px] text-slate-500">AI-generated guidance is evidence-based assistance for HR, not a substitute for human review or a hiring decision.</p>
            </div>
          </div>
        </section>
      )}

      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedCandidate.candidate_name}</h3>
                <p className="text-sm text-slate-500">{selectedCandidate.email}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className={`${buttonClasses.gray} rounded-lg px-3 py-1.5 text-sm font-medium`}>Close</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-700">CV Summary</p>
                <p className="text-sm text-slate-600">{selectedCandidate.feedback || 'No detailed analysis is available for this CV.'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-700">Score Breakdown</p>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between"><span>Overall</span><span>{selectedCandidate.score}/100</span></div>
                  <div className="flex justify-between"><span>Skills</span><span>{selectedCandidate.details?.skills_score ?? '—'}/100</span></div>
                  <div className="flex justify-between"><span>Experience</span><span>{selectedCandidate.details?.experience_score ?? '—'}/100</span></div>
                  <div className="flex justify-between"><span>Education</span><span>{selectedCandidate.details?.education_score ?? '—'}/100</span></div>
                  <div className="flex justify-between"><span>Communication</span><span>{selectedCandidate.details?.communication_score ?? '—'}/100</span></div>
                </div>
                <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-600">
                  Matched: {selectedCandidate.matched_requirements?.join(', ') || 'No explicit criteria matched'}<br />
                  Gaps: {selectedCandidate.missing_requirements?.join(', ') || 'No identified criteria gaps'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => shortlist(selectedCandidate.cv_id)} className={`${buttonClasses.green} h-10 w-32 shrink-0 rounded-xl text-sm font-semibold`}>Shortlist</button>
              <button onClick={() => reject(selectedCandidate.cv_id)} className={`${buttonClasses.red} h-10 w-32 shrink-0 rounded-xl text-sm font-semibold`}>Reject</button>
              <button className={`${buttonClasses.gray} h-10 w-32 shrink-0 rounded-xl text-sm font-semibold`}>Save Notes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsPage({ jobs, selectedJobId, setSelectedJobId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationResults = location.state?.ranking;
  const jobId = selectedJobId || location.state?.jobId || jobs[0]?.job_id || '';
  const [results, setResults] = useState(Array.isArray(navigationResults) ? navigationResults : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    if (location.state?.jobId === jobId && Array.isArray(location.state?.ranking)) {
      return;
    }
    let active = true;
    const loadResults = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/jobs/${jobId}/ranking`);
        if (active) setResults(Array.isArray(response.data?.ranking) ? response.data.ranking : []);
      } catch (requestError) {
        if (active) {
          setResults([]);
          setError(requestError.response?.data?.message || 'Unable to load evaluation results.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadResults();
    return () => { active = false; };
  }, [jobId, location.state]);

  return (
    <div className="app-page page-panel space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Completed evaluation</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Candidate Results</h2>
          <p className="mt-1 text-sm text-slate-500">CV analysis and ranking based on the submitted job requirements.</p>
        </div>
        <select value={jobId} onChange={(event) => {
          const nextJobId = event.target.value;
          setSelectedJobId(nextJobId);
          setError('');
          if (location.state?.jobId === nextJobId && Array.isArray(location.state?.ranking)) {
            setResults(location.state.ranking);
          }
        }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500">
          {jobs.map((job) => <option key={job.job_id} value={job.job_id}>{job.title}</option>)}
        </select>
      </div>

      {loading && <p role="status" className="text-sm text-slate-500">Loading saved evaluation results...</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && results.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No completed candidate evaluations are available for this job.</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {results.map((candidate) => (
          <article key={candidate.cv_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{candidate.candidate_name}</p>
                <p className="mt-1 text-xs text-slate-500">{candidate.status === 'shortlisted' ? 'Shortlisted' : candidate.status === 'rejected' ? 'Rejected' : 'Pending decision'} · Rank #{candidate.rank}</p>
                {candidate.email && candidate.email !== '-' && <p className="mt-1 text-xs text-slate-500">{candidate.email}</p>}
              </div>
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-right">
                <p className="text-xl font-semibold text-blue-700">{candidate.score}<span className="text-xs font-normal text-slate-500">/100</span></p>
                <p className="text-[10px] text-slate-500">match score</p>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">{candidate.feedback}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {[
                ['Skills', candidate.details?.skills_score],
                ['Experience', candidate.details?.experience_score],
                ['Education', candidate.details?.education_score],
                ['Communication', candidate.details?.communication_score],
              ].map(([label, score]) => (
                <div key={label} className="rounded-lg bg-indigo-50 px-3 py-2 text-slate-600">{label}<strong className="float-right text-slate-800">{score ?? '—'}{score !== undefined ? '%' : ''}</strong></div>
              ))}
            </div>
            <div className="mt-3 text-xs leading-5 text-slate-600">
              <p><strong className="text-emerald-700">Matched:</strong> {candidate.matched_requirements?.join(', ') || 'No explicit requirement match recorded'}</p>
              <p className="mt-1"><strong className="text-amber-700">Gaps:</strong> {candidate.missing_requirements?.join(', ') || 'No identified requirement gaps'}</p>
            </div>
            <button type="button" onClick={() => navigate('/interview-questions', { state: { jobId, candidateId: candidate.cv_id } })} className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">View interview questions</button>
          </article>
        ))}
      </div>
      <button type="button" onClick={() => navigate('/rankings')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Review full ranking</button>
    </div>
  );
}

function InterviewQuestionsPage({ jobs, selectedJobId, setSelectedJobId }) {
  const location = useLocation();
  const jobId = selectedJobId || location.state?.jobId || jobs[0]?.job_id || '';
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedCandidateId, setFocusedCandidateId] = useState(location.state?.candidateId || '');

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    const loadQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/jobs/${jobId}/ranking`);
        if (active) setRanking(Array.isArray(response.data?.ranking) ? response.data.ranking : []);
      } catch (requestError) {
        if (active) {
          setRanking([]);
          setError(requestError.response?.data?.message || 'Unable to load generated interview questions.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadQuestions();
    return () => { active = false; };
  }, [jobId]);

  const candidates = ranking.filter((candidate) => !focusedCandidateId || candidate.cv_id === focusedCandidateId);
  const getQuestionGroups = (questions = []) => {
    const groups = { hard: [], interview: [] };
    questions.slice(0, 10).forEach((item, index) => {
      const question = typeof item === 'string' ? { question: item } : item;
      const legacyHardQuestion = /problem.solving|technical/i.test(question.category || '')
        && /challenge|complex|difficult|trade.off|prioriti[sz]|strategy|debug|resolve|measure/i.test(question.question || '');
      const group = question.difficulty === 'hard' || (!question.difficulty && legacyHardQuestion)
        ? 'hard'
        : 'interview';
      groups[group].push({ ...question, index });
    });
    return groups;
  };

  const downloadQuestionsDocument = (candidate) => {
    const groups = getQuestionGroups(candidate.questions);
    const formatQuestions = (questions) => questions.length
      ? questions.map((question, index) => [
        `${index + 1}. ${question.question}`,
        `Category: ${question.category || 'Job-related'}`,
        question.reason ? `Reason: ${question.reason}` : '',
        question.related_evidence ? `Related evidence: ${question.related_evidence}` : '',
        question.evaluation_guidance ? `Evaluation guidance: ${question.evaluation_guidance}` : '',
      ].filter(Boolean).join('\n')).join('\n\n')
      : 'No questions in this section.';
    const content = [
      'QUESTIONS & INTERVIEWS',
      `Candidate: ${candidate.candidate_name}`,
      `Job: ${jobs.find((job) => job.job_id === jobId)?.title || 'Selected job'}`,
      '',
      'HARD QUESTIONS',
      formatQuestions(groups.hard),
      '',
      'INTERVIEW QUESTIONS',
      formatQuestions(groups.interview),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `questions-and-interviews-${candidate.candidate_name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-page page-panel questions-report-page space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Interview pipeline</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Questions &amp; Interviews</h2>
          <p className="mt-1 text-sm text-slate-500">Candidate-specific questions generated from the CV and submitted job requirements.</p>
        </div>
        <div className="questions-report-toolbar-actions">
          <select value={jobId} onChange={(event) => { setSelectedJobId(event.target.value); setFocusedCandidateId(''); }} className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500">
            {jobs.map((job) => <option key={job.job_id} value={job.job_id}>{job.title}</option>)}
          </select>
          <button type="button" onClick={() => window.print()} className="questions-report-print">Print / Save PDF</button>
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-slate-500">Loading candidate interview questions...</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && candidates.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No candidates are available for this job.</p>}
      <div className="grid gap-4">
        {candidates.map((candidate) => (
          <section key={candidate.cv_id} className="questions-report-card">
            <div className="questions-report-card-header">
              <div className="questions-report-candidate">
                <span className="questions-report-avatar" aria-hidden="true">{candidate.candidate_name?.charAt(0) || 'C'}</span>
                <div>
                  <p className="questions-report-eyebrow">Candidate interview report</p>
                  <h3>{candidate.candidate_name}</h3>
                  <p className="questions-report-meta">{candidate.email !== '-' ? candidate.email : 'Candidate'} <span aria-hidden="true">·</span> Rank #{candidate.rank}</p>
                </div>
              </div>
              <div className="questions-report-actions">
                <div className="questions-report-score">
                  <strong>{candidate.score}</strong><span>/100</span>
                  <small>Match score</small>
                </div>
                {candidate.questions?.length > 0 && <button type="button" onClick={() => downloadQuestionsDocument(candidate)} className="questions-report-download">Download document</button>}
              </div>
            </div>
            {candidate.questions?.length ? (
              <div className="questions-report-groups">
                {[
                  { key: 'hard', title: 'Hard Questions', description: 'Challenge-led and in-depth prompts', items: getQuestionGroups(candidate.questions).hard },
                  { key: 'interview', title: 'Interview Questions', description: 'Experience, motivation, and role fit', items: getQuestionGroups(candidate.questions).interview },
                ].map((group) => (
                  <section key={group.key} className={`question-group question-group--${group.key}`}>
                    <div className="question-group-header">
                      <div>
                        <p className="question-group-kicker">Question set</p>
                        <h4>{group.title}</h4>
                        <p className="question-group-description">{group.description}</p>
                      </div>
                      <span className="question-group-count">{String(group.items.length).padStart(2, '0')}</span>
                    </div>
                    {group.items.length ? (
                      <ol className="question-report-list">
                        {group.items.map((question, index) => (
                          <li key={`${candidate.cv_id}-${question.index}`} className="question-report-item">
                            <div className="question-report-item-header">
                              <span className="question-report-number">{String(index + 1).padStart(2, '0')}</span>
                              <span className="question-report-category">{question.category || 'Job-related'}</span>
                            </div>
                            <p className="question-report-prompt">{question.question}</p>
                            {(question.reason || question.related_evidence || question.evaluation_guidance) && (
                              <div className="question-report-details">
                                {question.reason && <p><strong>Why this question</strong>{question.reason}</p>}
                                {question.related_evidence && <p><strong>Related evidence</strong>{question.related_evidence}</p>}
                                {question.evaluation_guidance && <p><strong>What to listen for</strong>{question.evaluation_guidance}</p>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                    ) : <p className="question-group-empty">No questions in this section yet. Generate questions from the Ranking Page.</p>}
                  </section>
                ))}
              </div>
            ) : <p className="questions-report-empty">Questions have not been generated for this candidate.</p>}
          </section>
        ))}
      </div>
    </div>
  );
}

function SettingsPage({ selectedJobId, theme, setTheme }) {
  const [aiConfiguration, setAiConfiguration] = useState(null);
  const [aiConfigurationError, setAiConfigurationError] = useState('');
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/health`)
      .then(({ data }) => {
        if (active) setAiConfiguration(data.integrations?.openrouter || { configured: false });
      })
      .catch((error) => {
        if (active) setAiConfigurationError(error.response?.data?.message || 'Unable to read backend AI configuration.');
      });
    return () => { active = false; };
  }, []);

  const exportFile = async (type) => {
    if (!selectedJobId) {
      setExportError('Select a job with completed evaluations before exporting results.');
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/jobs/${selectedJobId}/ranking`);
      const candidates = Array.isArray(response.data?.ranking) ? response.data.ranking : [];
      const csv = [
        ['Rank', 'Candidate', 'Email', 'Score', 'Status', 'Feedback'],
        ...candidates.map((candidate) => [candidate.rank, candidate.candidate_name, candidate.email, candidate.score, candidate.status, candidate.feedback]),
      ].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const body = type === 'application/json' ? JSON.stringify(candidates, null, 2) : csv;
      const blob = new Blob([body], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `candidates-${type === 'application/json' ? 'data.json' : 'data.csv'}`;
      link.click();
      URL.revokeObjectURL(url);
      setExportError('');
    } catch (error) {
      setExportError(error.response?.data?.message || 'Unable to export candidate results.');
    }
  };

  return (
    <div className="app-page page-panel space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Workspace preferences</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Personalize your workspace and manage AI connections and data exports.</p>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Workspace theme</h3>
          <p className="mt-1 text-sm text-slate-500">Choose a visual style. Your preference is saved on this device.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {APP_THEMES.map((option) => {
            const isSelected = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setTheme(option.id)}
                className={`theme-option-card rounded-xl border p-4 text-left transition ${isSelected ? 'is-selected' : ''}`}
              >
                <div
                  className="theme-option-preview mb-4 flex h-24 gap-2 overflow-hidden rounded-lg border p-2"
                  data-preview-theme={option.id}
                  style={{
                    '--preview-bg': option.swatches[0],
                    '--preview-surface': option.swatches[1],
                    '--preview-brand': option.swatches[2],
                    '--preview-accent': option.swatches[3],
                  }}
                >
                  <div className="theme-preview-sidebar flex w-1/4 flex-col gap-1 rounded-md p-1.5">
                    <span className="theme-preview-mark h-2 w-2 rounded-sm" />
                    <span className="theme-preview-line h-1 w-full rounded-full" />
                    <span className="theme-preview-line h-1 w-3/4 rounded-full" />
                    <span className="theme-preview-line h-1 w-4/5 rounded-full" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                    <span className="theme-preview-line h-1.5 w-2/5 rounded-full" />
                    <div className="flex flex-1 gap-1.5">
                      <span className="theme-preview-card flex-1 rounded-md" />
                      <span className="theme-preview-card flex-1 rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{option.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
                  </span>
                  <span className="flex shrink-0 gap-1 pt-1" aria-label={`${option.name} colors`}>
                    {option.swatches.map((color) => <span key={color} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}
                  </span>
                </div>
                <span className="mt-3 block text-xs font-medium text-blue-600">{isSelected ? 'Active theme' : 'Preview and use theme'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">OpenRouter AI</h3>
          {aiConfigurationError ? (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{aiConfigurationError}</p>
          ) : (
            <p role="status" className={`rounded-xl p-3 text-sm ${aiConfiguration?.configured ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
              {aiConfiguration === null
                ? 'Checking backend configuration...'
                : aiConfiguration.configured
                  ? `OpenRouter is configured on the server. Evaluations, chat, and interview questions use ${aiConfiguration.model}.`
                  : 'OpenRouter is not configured. Add OPENROUTER_API_KEY to backend/.env and restart the backend.'}
            </p>
          )}
          <p className="text-xs leading-5 text-slate-500">The OpenRouter API key stays on the backend and is never sent to the browser. Provider errors are reported rather than silently switching providers.</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Export data</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportFile('text/csv')} className={`${buttonClasses.green} rounded-lg px-4 py-2 text-sm font-medium`}>Export CSV</button>
            <button onClick={() => exportFile('application/json')} className={`${buttonClasses.green} rounded-lg px-4 py-2 text-sm font-medium`}>Export JSON</button>
          </div>
          {exportError && <p role="alert" className="text-sm text-red-700">{exportError}</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
