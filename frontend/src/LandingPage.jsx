import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  Download,
  Link2,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Sparkles,
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

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <div className="landing-wrap landing-nav-inner">
          <a className="landing-brand" href="#home" aria-label="CV Screening home">
            <BrandMark />
            <span>CV Screening</span>
          </a>
          <nav className="landing-nav-links" aria-label="Main navigation">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#teams">For teams</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="landing-nav-actions">
            <Link className="landing-button landing-button-secondary landing-signin" to="/login">Sign in</Link>
            <Link className="landing-button landing-button-primary" to={getStarted} state={{ from: '/upload' }}>Get started</Link>
          </div>
        </div>
      </header>

      <section id="home" className="landing-hero">
        <div className="landing-grid-background" aria-hidden="true" />
        <div className="landing-wrap landing-hero-inner">
          <div className="landing-hero-copy">
            <span className="landing-chip"><strong>NEW</strong>Interview questions written from each CV</span>
            <h1>Screen 200 CVs in minutes. <em>Hire on evidence.</em></h1>
            <p className="landing-lede">CV Screening reads every application, scores it against your job&apos;s real requirements and shows the reason behind each score, so your team shortlists faster and fairer.</p>
            <div className="landing-hero-actions">
              <Link className="landing-button landing-button-primary" to={getStarted} state={{ from: '/upload' }}>Create your first job <ArrowRight size={18} aria-hidden="true" /></Link>
              <a className="landing-button landing-button-secondary" href="#how">See how it works</a>
            </div>
            <p className="landing-footnote">No setup fee · Works with PDF and DOCX · Your data stays in your workspace</p>
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
              { icon: Link2, title: 'Job link builder', text: 'A branded application form with your own fields: documents, images, text or numbers.' },
              { icon: BarChart3, title: 'Ranked shortlist', text: 'Candidates sorted by match, filtered by status, searchable by skill or name.' },
              { icon: Sparkles, title: 'AI summaries', text: 'A short, neutral summary of each CV. It describes the CV, never the person.', ai: true },
              { icon: MessageSquareText, title: 'Interview questions', text: 'Questions written from each CV, including the gaps worth probing. Print or save as PDF.', ai: true },
              { icon: Download, title: 'Export anytime', text: 'Download candidate shortlists and results as CSV for your team.' },
              { icon: ShieldCheck, title: 'Private workspaces', text: 'Each company’s data is isolated. Access is checked on every request.' },
            ].map(({ icon: Icon, title, text, ai }) => (
              <article className="landing-feature" key={title}><span className={ai ? 'is-ai' : ''}><Icon size={22} aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section id="teams" className="landing-wrap landing-teams-section">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">For teams</p>
          <h2>Built for HR teams and the people who run the platform</h2>
        </div>
        <div className="landing-roles">
          <article className="landing-role landing-role-hr">
            <p className="landing-eyebrow">HR workspace</p><h3>Hire with less reading</h3>
            <ul><li><Check />Create jobs and branded application forms</li><li><Check />Run AI evaluation on every CV at once</li><li><Check />Shortlist, review or reject with a reason</li><li><Check />Print tailored interview questions</li></ul>
          </article>
          <article className="landing-role landing-role-admin">
            <p className="landing-eyebrow">System admin</p><h3>Run many companies from one place</h3>
            <ul><li><Check />Create, suspend or remove company workspaces</li><li><Check />Manage HR users and their permissions</li><li><Check />See sign-ins and activity across the platform</li><li><Check />Set platform-wide defaults in one screen</li></ul>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-heading"><p className="landing-eyebrow">Fair by design</p><h2>AI that helps you judge CVs, not people</h2></div>
          <div className="landing-trust">
            <article><h3>Neutral language</h3><p>Summaries say “No TypeScript listed”, never “weak developer”. The rules are built into every prompt.</p></article>
            <article><h3>You stay in control</h3><p>The AI ranks and explains. A person makes every shortlist and rejection.</p></article>
            <article><h3>Keys stay on the server</h3><p>AI provider keys never reach the browser, and errors are shown instead of silently switching providers.</p></article>
          </div>
        </div>
      </section>

      <section id="faq" className="landing-wrap landing-faq-section">
        <div className="landing-section-heading is-centered"><p className="landing-eyebrow">FAQ</p><h2>Questions, answered</h2></div>
        <div className="landing-faq">
          {[
            ['What file types can candidates upload?', 'PDF and DOCX for CVs. You can also add fields for certificates, ID photos and other documents or images.'],
            ['How is the match score calculated?', 'Each CV is compared with the requirements you set: must-have skills, years of experience, qualifications and any custom criteria. The score breakdown is shown next to it.'],
            ['Can I change a decision the AI suggested?', 'Yes. Scores are a guide. You set every status (Shortlisted, Needs review or Rejected) yourself.'],
            ['Is our company’s data kept separate?', 'Yes. Every company gets an isolated workspace, and HR access is checked on every protected request.'],
            ['Can I export my data?', 'Shortlists and candidate results can be downloaded as CSV for use in spreadsheets.'],
          ].map(([question, answer], index) => (
            <details key={question} open={index === 0}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>
          ))}
        </div>
      </section>

      <section className="landing-wrap landing-cta-section">
        <div className="landing-cta">
          <span className="landing-cta-ring landing-cta-ring-one" aria-hidden="true" />
          <span className="landing-cta-ring landing-cta-ring-two" aria-hidden="true" />
          <BrandMark light />
          <h2>Screen faster. Hire fairer.</h2>
          <p>Post your next job today and see a ranked, explained shortlist as soon as CVs arrive.</p>
          <div><Link className="landing-button landing-button-light" to={getStarted} state={{ from: '/upload' }}>Get started <ArrowRight size={17} aria-hidden="true" /></Link><a className="landing-button landing-button-cta-outline" href="#how">See how it works</a></div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap">
          <a className="landing-brand" href="#home"><BrandMark /><span>CV Screening</span></a>
          <nav aria-label="Footer navigation"><a href="#how">How it works</a><a href="#features">Features</a><a href="#faq">FAQ</a><a href="#teams">For teams</a></nav>
          <p>© 2026 CV Screening · Borama, Somaliland</p>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
