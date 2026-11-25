import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  FileCheck2,
  GraduationCap,
  Link2,
  Menu,
  MessageSquareText,
  Plus,
  SearchCheck,
  X,
} from 'lucide-react';

function BrandMark({ light = false }) {
  const color = light ? '#ffffff' : '#2f2dd6';
  return (
    <svg width="42" height="26" viewBox="0 0 200 120" aria-hidden="true">
      <path d="M87.6 32.4 A39 39 0 1 0 87.6 87.6" fill="none" stroke={color} strokeWidth="22" />
      <polygon points="96,10 120,10 146,78.4 172,10 196,10 158,110 134,110" fill={color} />
    </svg>
  );
}

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.8 11.8 0 0 0 12.06 0C5.55 0 .25 5.29.25 11.81c0 2.08.54 4.11 1.57 5.9L.13 24l6.44-1.69a11.8 11.8 0 0 0 5.49 1.4h.01c6.5 0 11.8-5.29 11.8-11.81 0-3.16-1.23-6.12-3.35-8.42Zm-8.46 18.17a9.78 9.78 0 0 1-4.98-1.36l-.36-.21-3.82 1 1.02-3.72-.23-.38a9.78 9.78 0 0 1-1.51-5.17c0-5.42 4.41-9.82 9.83-9.82 2.62 0 5.09 1.02 6.94 2.88a9.74 9.74 0 0 1 2.88 6.94c0 5.42-4.41 9.84-9.77 9.84Zm5.39-7.37c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.51.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.51-.08-.15-.66-1.59-.91-2.18-.24-.57-.48-.5-.66-.51h-.56c-.2 0-.51.07-.78.37-.27.3-1.02 1-1.02 2.43 0 1.43 1.05 2.82 1.19 3.01.15.2 2.06 3.15 5 4.42.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.75-.71 2-1.4.24-.69.24-1.28.17-1.4-.07-.12-.27-.2-.57-.34Z" />
    </svg>
  );
}

function GmailIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M24 5v14c0 1.1-.9 2-2 2h-2V7.3l-8 6.2-8-6.2V21H2c-1.1 0-2-.9-2-2V5c0-.74.4-1.38 1-1.73L12 12l11-8.73A2 2 0 0 1 24 5Z"/>
      <path fill="#34A853" d="M12 12 4 5.8V21H2V5l10 7Z"/>
      <path fill="#4285F4" d="M22 5v16h-2V5.8L12 12V9l10-7c.6.35 1 .99 1 1.73V5Z"/>
      <path fill="#FBBC04" d="M4 5.8V21h16V5.8l-8 6.2-8-6.2Z" opacity=".15"/>
    </svg>
  );
}

function LinkedInIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z"/>
    </svg>
  );
}

function GitHubIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5A12 12 0 0 0 8.2 23.88c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.58A12 12 0 0 0 12 .5Z"/>
    </svg>
  );
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const createAccount = { pathname: '/register', state: { from: '/dashboard' } };

  const closeMenu = () => setMenuOpen(false);
  const contactLinks = [
    { label: 'WhatsApp', value: 'Chat on WhatsApp', href: 'https://wa.me/252634594307?s=p', icon: WhatsAppIcon },
    { label: 'Gmail', value: 'abdilahimohamed459@gmail.com', href: 'mailto:abdilahimohamed459@gmail.com', icon: GmailIcon },
    { label: 'LinkedIn', value: 'Abdilahi Mohamed', href: 'https://www.linkedin.com/in/abdilahi-mohamed-564317393', icon: LinkedInIcon },
    { label: 'GitHub', value: 'Abdilahi-mohamed', href: 'https://github.com/Abdilahi-mohamed', icon: GitHubIcon },
  ];

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <div className="landing-wrap landing-nav-inner">
          <a className="landing-brand" href="#home" aria-label="CV Screening home">
            <BrandMark />
            <span>CV Screening</span>
          </a>

          <nav className={`landing-nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#how" onClick={closeMenu}>How It Works</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <a href="#faq" onClick={closeMenu}>FAQ</a>
          </nav>

          <div className="landing-nav-actions">
            <Link className="landing-button landing-button-secondary landing-signin" to="/login">Login</Link>
            <Link className="landing-button landing-button-primary landing-get-started" to={createAccount}>Create Account</Link>
            <button className="landing-menu-button" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <section id="home" className="landing-hero">
        <div className="landing-grid-background" aria-hidden="true" />
        <div className="landing-wrap landing-hero-inner">
          <div className="landing-hero-copy">
            <span className="landing-chip"><strong>AI RECRUITMENT</strong>Job-specific screening</span>
            <h1>Smarter Hiring Starts with <em>AI-Powered CV Screening.</em></h1>
            <p className="landing-lede">Analyze CVs, evaluate candidates against job requirements, and rank applicants with clear 0–100 scores.</p>
            <div className="landing-hero-actions">
              <Link className="landing-button landing-button-primary" to={createAccount}>Create Account <ArrowRight size={18} /></Link>
              <a className="landing-button landing-button-secondary" href="#features">Explore Features</a>
            </div>
          </div>

          <div className="landing-demo" role="img" aria-label="Illustrative CV ranking dashboard">
            <div className="landing-demo-cv">
              <div className="landing-demo-person"><span>AH</span><div><i /><i /></div></div>
              <p>EXPERIENCE</p><i className="landing-demo-line w-92" /><i className="landing-demo-line landing-highlight w-78" />
              <p>SKILLS</p><i className="landing-demo-line landing-highlight w-60" /><i className="landing-demo-line w-72" />
              <p>EDUCATION</p><i className="landing-demo-line w-80" />
              <span className="landing-scan" />
            </div>
            <article className="landing-demo-result">
              <div className="landing-demo-result-heading">
                <div><strong>Amina Hassan</strong><small>Senior Full Stack Engineer</small></div>
                <div className="landing-demo-score"><strong>87%</strong><small>SCORE</small></div>
              </div>
              <div className="landing-demo-bars">
                <div><span>Required skills <small>6 of 7</small></span><i><b style={{ width: '86%' }} /></i></div>
                <div><span>Experience <small>4 of 3 yrs</small></span><i><b style={{ width: '100%' }} /></i></div>
              </div>
              <div className="landing-demo-tags"><span>React</span><span>Node.js</span><span>SQL</span></div>
              <span className="landing-demo-shortlisted"><Check size={13} />Strong match</span>
            </article>
            <article className="landing-demo-summary">
              <strong><span />AI SUMMARY</strong>
              <p>Relevant React and Node.js experience. Confirm TypeScript and leadership scope.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Core Features</p>
            <h2>Everything needed to screen candidates</h2>
          </div>
          <div className="landing-features">
            {[
              [SearchCheck, 'AI CV Analysis', 'Extract relevant CV information and qualifications.', true],
              [BriefcaseBusiness, 'Job Management', 'Create vacancies and define role requirements.'],
              [Link2, 'Application Links', 'Share branded job links for online applications.'],
              [BarChart3, 'Candidate Ranking', 'Rank applicants with transparent 0–100 scores.'],
              [FileCheck2, 'Document Management', 'Manage CVs and supporting application documents.'],
              [MessageSquareText, 'Interview Questions', 'Generate up to 10 role-specific questions.', true],
            ].map(([Icon, title, text, ai]) => (
              <article className="landing-feature" key={title}>
                <span className={ai ? 'is-ai' : ''}><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">How It Works</p>
            <h2>From vacancy to shortlist in four steps</h2>
          </div>
          <div className="landing-steps">
            {[
              ['Create the job', 'Add title, skills, experience, and requirements.'],
              ['Share the link', 'Candidates submit applications and upload CVs.'],
              ['AI evaluates', 'CVs are scored against the job requirements.'],
              ['Review candidates', 'Compare reports, rankings, and interview questions.'],
            ].map(([title, text], index) => (
              <article className="landing-step" key={title}>
                <span className="landing-step-number">{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-ranking-section">
        <div className="landing-wrap landing-ranking-layout">
          <div className="landing-ranking-heading">
            <p className="landing-eyebrow">Candidate Ranking</p>
            <h2>Compare candidates clearly</h2>
            <p>Illustrative sample data. AI supports recruiter decisions; it does not make final hiring decisions.</p>
          </div>
          <div className="landing-ranking-panel">
            <div className="landing-ranking-toolbar"><strong>Senior Full Stack Engineer</strong><span>Sample data</span></div>
            <div className="landing-ranking-table">
              {[
                ['1', 'Amina Hassan', 'React, Node.js, SQL', '87%', 'Strong match'],
                ['2', 'Omar Ahmed', 'React, Express, AWS', '81%', 'Strong match'],
                ['3', 'Fartun Yusuf', 'JavaScript, SQL, PHP', '68%', 'Further review'],
              ].map(([rank, name, skills, score, status]) => (
                <div className="landing-ranking-row" key={name}>
                  <span className="landing-rank">{rank}</span>
                  <span><strong>{name}</strong><small>Senior Full Stack Engineer</small></span>
                  <span className="landing-ranking-skills"><GraduationCap size={15} />{skills}</span>
                  <b>{score}</b>
                  <span className={status === 'Strong match' ? 'is-success' : 'is-review'}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-wrap landing-solutions-section">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">Solutions</p>
          <h2>Built for practical recruiting needs</h2>
        </div>
        <div className="landing-solutions landing-solutions-short">
          {[
            ['HR Teams', 'Organize vacancies, applications, and candidate feedback.'],
            ['Recruitment Agencies', 'Evaluate applicants consistently across multiple roles.'],
            ['Growing Businesses', 'Save review time with structured, job-specific screening.'],
          ].map(([title, text]) => (
            <article className="landing-solution" key={title}>
              <BriefcaseBusiness size={20} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="landing-wrap landing-faq-section">
        <div className="landing-section-heading is-centered">
          <p className="landing-eyebrow">FAQ</p>
          <h2>Common questions</h2>
        </div>
        <div className="landing-faq">
          {[
            ['What is CV Screening?', 'An AI-assisted platform for managing vacancies and evaluating candidates.'],
            ['Which CV formats are supported?', 'PDF and DOCX CV uploads are supported.'],
            ['How are scores calculated?', 'Candidates receive 0–100 scores based on job-specific requirements and available CV evidence.'],
            ['Does AI make the final decision?', 'No. Recruiters make every final hiring decision.'],
            ['How do I access the platform?', 'Use the Login page with your authorized owner or HR account.'],
          ].map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary>{question}<Plus size={18} /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contact" className="landing-section landing-contact-section">
        <div className="landing-wrap landing-contact-layout">
          <div className="landing-contact-copy">
            <p className="landing-eyebrow">Contact</p>
            <h2>Contact Me</h2>
            <p>Have a question about CV Screening or need workspace access? Get in touch.</p>
            <div className="landing-contact-links">
              {contactLinks.map(({ label, value, href, icon: Icon }) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>
                  <span><Icon size={18} /></span>
                  <div><small>{label}</small><strong>{value}</strong></div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-wrap landing-cta-section">
        <div className="landing-cta">
          <span className="landing-cta-ring landing-cta-ring-one" aria-hidden="true" />
          <span className="landing-cta-ring landing-cta-ring-two" aria-hidden="true" />
          <BrandMark light />
          <h2>Find the Right Talent.</h2>
          <p>Modernize recruitment with intelligent CV analysis and structured candidate evaluation.</p>
          <div>
            <Link className="landing-button landing-button-light" to={createAccount}>Create Account <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap">
          <a className="landing-brand" href="#home"><BrandMark /><span>CV Screening</span></a>
          <nav aria-label="Footer navigation">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#contact">Contact</a>
            <a href="#faq">FAQ</a>
            <Link to="/login">Login</Link>
          </nav>
          <nav className="landing-footer-social" aria-label="Social and contact links">
            <a href="mailto:abdilahimohamed459@gmail.com" aria-label="Gmail"><GmailIcon size={16} /></a>
            <a href="https://wa.me/252634594307?s=p" target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsAppIcon size={16} /></a>
            <a href="https://www.linkedin.com/in/abdilahi-mohamed-564317393" target="_blank" rel="noreferrer" aria-label="LinkedIn"><LinkedInIcon size={16} /></a>
            <a href="https://github.com/Abdilahi-mohamed" target="_blank" rel="noreferrer" aria-label="GitHub"><GitHubIcon size={16} /></a>
          </nav>
          <p>© 2026 CV Screening</p>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
