import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  Download,
  FileCheck2,
  GraduationCap,
  Link2,
  Menu,
  MessageSquareText,
  Plus,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users,
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

function LandingPage() {
  const getStarted = '/login';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <div className="landing-wrap landing-nav-inner">
          <a className="landing-brand" href="#home" aria-label="CV Screening home">
            <BrandMark />
            <span>CV Screening</span>
          </a>
          <nav className={`landing-nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#solutions" onClick={() => setMenuOpen(false)}>Solutions</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          </nav>
          <div className="landing-nav-actions">
            <Link className="landing-button landing-button-secondary landing-signin" to="/login">Login</Link>
            <Link className="landing-button landing-button-primary landing-get-started" to={getStarted} state={{ from: '/upload' }}>Get Started</Link>
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
            <span className="landing-chip"><strong>AI RECRUITMENT</strong>Structured candidate evaluation</span>
            <h1>Smarter Hiring Starts with <em>AI-Powered CV Screening.</em></h1>
            <p className="landing-lede">Transform your recruitment process with intelligent CV analysis, automated candidate evaluation, and AI-powered ranking. Find the right talent faster and make better hiring decisions.</p>
            <div className="landing-hero-actions">
              <Link className="landing-button landing-button-primary" to={getStarted} state={{ from: '/upload' }}>Start Screening <ArrowRight size={18} aria-hidden="true" /></Link>
              <a className="landing-button landing-button-secondary" href="#features">Explore Features</a>
            </div>
            <p className="landing-footnote">CV uploads · Job-specific evaluation · Explainable 0–100 scores</p>
          </div>

          <div className="landing-demo" role="img" aria-label="Illustration of a CV being scanned and matched to a job">
            <div className="landing-demo-cv">
              <div className="landing-demo-person"><span>AH</span><div><i /><i /></div></div>
              <p>EXPERIENCE</p><i className="landing-demo-line w-92" /><i className="landing-demo-line landing-highlight w-78" /><i className="landing-demo-line w-85" />
              <p>SKILLS</p><i className="landing-demo-line landing-highlight w-60" /><i className="landing-demo-line w-72" /><i className="landing-demo-line landing-highlight w-50" />
              <p>EDUCATION</p><i className="landing-demo-line w-80" /><i className="landing-demo-line w-40" />
              <span className="landing-scan" />
            </div>
            <article className="landing-demo-result">
              <div className="landing-demo-result-heading"><div><strong>Amina Hassan</strong><small>Senior Full Stack Engineer</small></div><div className="landing-demo-score"><strong>87%</strong><small>MATCH</small></div></div>
              <div className="landing-demo-bars">
                <div><span>Required skills <small>6 of 7</small></span><i><b style={{ width: '86%' }} /></i></div>
                <div><span>Experience <small>4 of 3 yrs</small></span><i><b style={{ width: '100%' }} /></i></div>
                <div><span>Custom criteria <small>3 of 5</small></span><i><b className="is-review" style={{ width: '60%' }} /></i></div>
              </div>
              <div className="landing-demo-tags"><span>React</span><span>Node.js</span><span>SQL</span><span className="is-missing">No TypeScript</span></div>
              <span className="landing-demo-shortlisted"><Check size={13} aria-hidden="true" />Shortlisted</span>
            </article>
            <article className="landing-demo-summary"><strong><span />AI SUMMARY</strong><p>Built two production React and Node.js apps over 4 yrs. Led a team of 3. No TypeScript listed.</p></article>
          </div>
        </div>
      </section>

      <section id="how" className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">How it works</p>
            <h2>From job post to shortlist in four steps</h2>
            <p>You decide what matters. CV Screening does the reading and shows its working.</p>
          </div>
          <div className="landing-steps">
            {[
              { title: 'Create the job', text: 'Write the description, list must-have skills, experience and certificates, and add your logo and colour.', preview: <><span className="landing-mini-tag">React ×</span><span className="landing-mini-tag">Node.js ×</span><small>Min. experience · 3 yrs</small></> },
              { title: 'Share one link', text: 'Candidates apply on your branded form and upload their CV. You choose which fields are required.', preview: <><code>cvscreening.app/apply</code><small>One link for every applicant</small></> },
              { title: 'AI scores every CV', text: 'Each CV is checked against every requirement and given a match score with the reason behind it.', preview: <><b>Amina H. <span>87%</span></b><i><b style={{ width: '87%' }} /></i><b>Yusuf A. <span className="is-review">64%</span></b><i><b className="is-review" style={{ width: '64%' }} /></i></> },
              { title: 'Review and interview', text: 'Shortlist with one click, then print interview questions written for each candidate.', preview: <><span className="landing-mini-shortlist"><Check size={13} />Shortlisted</span><small>Tailored questions ready</small></> },
            ].map((step, index) => (
              <article className="landing-step" key={step.title}>
                <span className="landing-step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <div className="landing-step-preview">{step.preview}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-wrap landing-explain-section">
        <div className="landing-explain">
          <div className="landing-explain-copy">
            <p className="landing-eyebrow">Explainable scores</p>
            <h2>Every score shows its reason</h2>
            <p>No black box. You see which requirements matched, which are missing and what the AI read, so you can trust the ranking or overrule it.</p>
            <ul>
              <li><Check aria-hidden="true" />Scores broken down by skills, experience and qualifications</li>
              <li><Check aria-hidden="true" />AI-written text is always labelled, so you know what a model wrote</li>
              <li><Check aria-hidden="true" />The final decision is always yours</li>
            </ul>
          </div>
          <div className="landing-score-panel">
            <div className="landing-score-panel-heading"><strong>Score breakdown</strong><b>87%</b></div>
            {[
              ['Required skills', '86%', 86],
              ['Experience', '4 / 3 yrs', 100],
              ['Qualifications', '1 of 1', 100],
              ['Custom criteria', '3 of 5', 60],
            ].map(([label, detail, score], index) => (
              <div className="landing-score-criterion" key={label}><span>{label}</span><i><b className={index === 3 ? 'is-review' : ''} style={{ width: `${score}%` }} /></i><small>{detail}</small></div>
            ))}
            <div className="landing-score-tags"><span>React</span><span>Node.js</span><span>Express</span><span>SQL</span><span className="is-missing">Missing: TypeScript</span></div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Features</p>
            <h2>Everything your hiring team needs, nothing it doesn&apos;t</h2>
          </div>
          <div className="landing-features">
            {[
              { icon: SearchCheck, title: 'AI CV Analysis', text: 'Extract and analyze relevant information from uploaded CV documents.', ai: true },
              { icon: ClipboardCheck, title: 'Smart Candidate Evaluation', text: 'Compare candidates against the requirements of each specific vacancy.', ai: true },
              { icon: BarChart3, title: 'Candidate Ranking', text: 'Rank applicants with transparent evaluation scores from 0–100.' },
              { icon: BriefcaseBusiness, title: 'Job Management', text: 'Create, manage, and organize vacancies, qualifications, and requirements.' },
              { icon: Link2, title: 'Shareable Job Links', text: 'Publish a job-specific application link for online candidate submissions.' },
              { icon: FileCheck2, title: 'Document Management', text: 'Manage CVs, certificates, KUR images, and supporting documents.' },
              { icon: MessageSquareText, title: 'AI Interview Questions', text: 'Generate up to 10 relevant questions based on the role and candidate profile.', ai: true },
              { icon: BarChart3, title: 'Recruitment Analytics', text: 'Monitor applications, evaluations, rankings, and recruitment progress.' },
              { icon: ShieldCheck, title: 'Recruiter Feedback', text: 'Review AI results and record recruiter feedback for every candidate.' },
            ].map(({ icon: Icon, title, text, ai }) => (
              <article className="landing-feature" key={title}><span className={ai ? 'is-ai' : ''}><Icon size={22} aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-ranking-section">
        <div className="landing-wrap landing-ranking-layout">
          <div className="landing-section-heading landing-ranking-heading">
            <p className="landing-eyebrow">Candidate ranking</p>
            <h2>Compare applicants with consistent 0–100 scoring</h2>
            <p>AI scores support recruiter decisions; they do not independently make final hiring decisions.</p>
          </div>
          <div className="landing-ranking-panel">
            <div className="landing-ranking-toolbar"><strong>Senior Full Stack Engineer</strong><span>Sample data</span></div>
            <div className="landing-ranking-table" role="table" aria-label="Illustrative candidate ranking">
              {[
                ['1', 'Amina Hassan', 'React, Node.js, SQL', '87%', 'Strong match'],
                ['2', 'Omar Ahmed', 'React, Express, AWS', '81%', 'Strong match'],
                ['3', 'Fartun Yusuf', 'JavaScript, SQL, PHP', '68%', 'Further review'],
              ].map(([rank, name, skills, score, status]) => (
                <div className="landing-ranking-row" role="row" key={name}>
                  <span className="landing-rank">{rank}</span>
                  <span><strong>{name}</strong><small>Applied position · Senior Full Stack Engineer</small></span>
                  <span className="landing-ranking-skills"><GraduationCap size={15} />{skills}</span>
                  <b>{score}</b>
                  <span className={status === 'Strong match' ? 'is-success' : 'is-review'}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-wrap landing-report-section">
        <div className="landing-report-preview">
          <div className="landing-report-header"><span className="landing-report-avatar">AH</span><div><p>Candidate overview</p><h3>Amina Hassan</h3></div><b>87 / 100</b></div>
          <div className="landing-report-grid">
            <article><Award size={18} /><span><strong>Relevant skills</strong><small>React, Node.js, SQL, Express</small></span></article>
            <article><GraduationCap size={18} /><span><strong>Education match</strong><small>Degree requirement met</small></span></article>
            <article><BriefcaseBusiness size={18} /><span><strong>Experience match</strong><small>4 years of relevant experience</small></span></article>
            <article><ClipboardCheck size={18} /><span><strong>Job requirements</strong><small>6 of 7 primary requirements</small></span></article>
          </div>
          <div className="landing-report-bottom">
            <div><p><strong>Strengths</strong></p><ul><li>Production React and Node.js experience</li><li>Strong database and API background</li></ul></div>
            <div><p><strong>Further review</strong></p><ul><li>Confirm TypeScript experience</li><li>Validate leadership scope</li></ul></div>
          </div>
        </div>
        <div className="landing-report-copy">
          <p className="landing-eyebrow">AI evaluation report</p>
          <h2>See the evidence behind every recommendation</h2>
          <p>Review skills, education, experience, requirement matches, strengths, and areas needing further discussion before making a decision.</p>
          <div className="landing-question-preview"><MessageSquareText size={18} /><div><strong>Suggested interview questions</strong><small>Up to 10 role and profile-specific questions</small></div></div>
        </div>
      </section>

      <section id="solutions" className="landing-wrap landing-teams-section">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">Who can use CV Screening?</p>
          <h2>Designed for organized, modern recruitment teams</h2>
        </div>
        <div className="landing-solutions">
          {[
            ['HR Departments', 'Manage every vacancy and candidate in a centralized workflow.'],
            ['Recruitment Agencies', 'Evaluate applicants consistently across multiple client roles.'],
            ['Small & Medium Businesses', 'Reduce repetitive screening without adding administrative overhead.'],
            ['Large Organizations', 'Standardize job-specific evaluation across hiring teams.'],
            ['Hiring Managers', 'Review ranked candidates and the evidence behind each score.'],
            ['Talent Acquisition Teams', 'Improve visibility, comparisons, and recruitment progress.'],
          ].map(([title, text]) => (
            <article className="landing-solution" key={title}><Users size={20} /><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-heading"><p className="landing-eyebrow">Fair by design</p><h2>AI that helps you judge CVs, not people</h2></div>
          <div className="landing-trust">
            <article><Sparkles size={22} /><h3>AI-assisted recruitment</h3><p>Automate document analysis and candidate evaluation while keeping recruiters in control.</p></article>
            <article><SearchCheck size={22} /><h3>Structured evaluation</h3><p>Compare candidates consistently against job-specific skills, education, and experience.</p></article>
            <article><BriefcaseBusiness size={22} /><h3>Organized workflows</h3><p>Centralize applications, rankings, reports, feedback, and hiring progress.</p></article>
            <article><ShieldCheck size={22} /><h3>Human final decision</h3><p>AI supports recruiter decisions; hiring managers make every final selection.</p></article>
          </div>
        </div>
      </section>

      <section id="pricing" className="landing-wrap landing-pricing-section">
        <div className="landing-pricing-card">
          <div>
            <p className="landing-eyebrow">Pricing</p>
            <h2>Start with the recruitment workspace you need</h2>
            <p>Public subscription pricing is not currently configured. Contact the system owner for workspace access and organization requirements.</p>
          </div>
          <div className="landing-pricing-actions">
            <Link className="landing-button landing-button-primary" to={getStarted} state={{ from: '/upload' }}>Get Started</Link>
            <a className="landing-button landing-button-secondary" href="#contact">Contact Sales</a>
          </div>
        </div>
      </section>

      <section id="faq" className="landing-wrap landing-faq-section">
        <div className="landing-section-heading is-centered"><p className="landing-eyebrow">FAQ</p><h2>Questions, answered</h2></div>
        <div className="landing-faq">
          {[
            ['What is CV Screening?', 'CV Screening is an AI-assisted recruitment platform for managing vacancies, receiving applications, analyzing CV documents, evaluating candidates, and organizing hiring decisions.'],
            ['How does AI CV screening work?', 'The system extracts CV information and compares it with job-specific requirements such as skills, experience, qualifications, and custom criteria.'],
            ['Which CV document formats are supported?', 'The configured application workflow supports PDF and DOCX CV uploads, plus additional company-configured document fields where enabled.'],
            ['Can I create multiple job vacancies?', 'Yes. Authorized recruiters can create and manage multiple vacancies from their company workspace.'],
            ['How are candidate scores calculated?', 'Candidates receive a 0–100 AI evaluation based on job requirements and available CV evidence. The report displays the relevant skills, experience, education, and requirement matches.'],
            ['Can I generate job application links?', 'Yes. Each vacancy can generate a shareable application link for candidate submissions.'],
            ['Can the system generate interview questions?', 'Yes. The AI can generate up to 10 role- and candidate-relevant interview questions for recruiter review.'],
            ['Can recruiters review AI evaluation reports?', 'Yes. Recruiters can view candidate reports, scores, strengths, review areas, and provide feedback.'],
            ['Does AI make the final hiring decision?', 'No. AI scores support recruiter decisions, but a recruiter or hiring manager retains final decision-making authority.'],
            ['How can I access my account?', 'Use the Login page with your authorized owner or company HR username and password.'],
          ].map(([question, answer], index) => (
            <details key={question} open={index === 0}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>
          ))}
        </div>
      </section>

      <section id="contact" className="landing-wrap landing-cta-section">
        <div className="landing-cta">
          <span className="landing-cta-ring landing-cta-ring-one" aria-hidden="true" />
          <span className="landing-cta-ring landing-cta-ring-two" aria-hidden="true" />
          <BrandMark light />
          <h2>Find the Right Talent. Make Smarter Hiring Decisions.</h2>
          <p>Modernize your recruitment process with intelligent CV analysis, candidate evaluation, and automated recruitment workflows.</p>
          <div><Link className="landing-button landing-button-light" to={getStarted} state={{ from: '/upload' }}>Start Screening <ArrowRight size={17} aria-hidden="true" /></Link><a className="landing-button landing-button-cta-outline" href="#pricing">Contact Us</a></div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap">
          <a className="landing-brand" href="#home"><BrandMark /><span>CV Screening</span></a>
          <nav aria-label="Footer navigation"><a href="#features">Features</a><a href="#solutions">Solutions</a><a href="#how">How It Works</a><a href="#faq">FAQ</a><a href="#pricing">Pricing</a></nav>
          <p>© 2026 CV Screening · Borama, Somaliland</p>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
