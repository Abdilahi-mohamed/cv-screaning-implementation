import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  FileCheck2,
  GraduationCap,
  ExternalLink,
  Link2,
  Mail,
  Menu,
  MessageSquareText,
  MessageCircle,
  Plus,
  SearchCheck,
  Send,
  ShieldCheck,
  Sparkles,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const getStarted = { pathname: '/login', state: { from: '/upload' } };

  const closeMenu = () => setMenuOpen(false);
  const contactLinks = [
    { label: 'Email', value: 'abdilahimohamed459@gmail.com', href: 'mailto:abdilahimohamed459@gmail.com', icon: Mail },
    { label: 'WhatsApp', value: 'Chat on WhatsApp', href: 'https://wa.me/252634594307?s=p', icon: MessageCircle },
    { label: 'LinkedIn', value: 'Abdilahi Mohamed', href: 'https://www.linkedin.com/in/abdilahi-mohamed-564317393', icon: ExternalLink },
    { label: 'GitHub', value: 'Abdilahi-mohamed', href: 'https://github.com/Abdilahi-mohamed', icon: ExternalLink },
  ];

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setContactSubmitting(true);
    setContactStatus({ type: '', message: '' });

    try {
      const response = await axios.post('/api/contact', contactForm);
      setContactStatus({ type: 'success', message: response.data.message });
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      setContactStatus({
        type: 'error',
        message: error.response?.data?.message || 'Unable to send your message. Please use email or WhatsApp.',
      });
    } finally {
      setContactSubmitting(false);
    }
  };

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
            <Link className="landing-button landing-button-primary landing-get-started" to={getStarted}>Get Started</Link>
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
              <Link className="landing-button landing-button-primary" to={getStarted}>Start Screening <ArrowRight size={18} /></Link>
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

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Why CV Screening</p>
            <h2>Faster, structured, and more consistent hiring</h2>
          </div>
          <div className="landing-trust">
            <article><Sparkles size={22} /><h3>AI-assisted recruitment</h3><p>Reduce repetitive CV review.</p></article>
            <article><ShieldCheck size={22} /><h3>Human decisions</h3><p>Recruiters retain final control.</p></article>
            <article><BarChart3 size={22} /><h3>Clear visibility</h3><p>Centralize applications and reports.</p></article>
            <article><Check size={22} /><h3>Consistent evaluation</h3><p>Compare every candidate by role requirements.</p></article>
          </div>
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

          <form className="landing-contact-form" onSubmit={handleContactSubmit}>
            <div>
              <label htmlFor="contact-name">Name</label>
              <input id="contact-name" name="name" value={contactForm.name} onChange={(event) => setContactForm((form) => ({ ...form, name: event.target.value }))} required minLength={2} maxLength={100} />
            </div>
            <div>
              <label htmlFor="contact-email">Email</label>
              <input id="contact-email" name="email" type="email" value={contactForm.email} onChange={(event) => setContactForm((form) => ({ ...form, email: event.target.value }))} required maxLength={254} />
            </div>
            <div>
              <label htmlFor="contact-message">Message</label>
              <textarea id="contact-message" name="message" rows="5" value={contactForm.message} onChange={(event) => setContactForm((form) => ({ ...form, message: event.target.value }))} required minLength={10} maxLength={2000} />
            </div>
            {contactStatus.message && <p className={`landing-contact-status is-${contactStatus.type}`} role="status">{contactStatus.message}</p>}
            <button className="landing-button landing-button-primary" type="submit" disabled={contactSubmitting}>
              {contactSubmitting ? 'Sending…' : 'Send Message'} <Send size={16} />
            </button>
          </form>
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
            <Link className="landing-button landing-button-light" to={getStarted}>Start Screening <ArrowRight size={17} /></Link>
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
            <a href="mailto:abdilahimohamed459@gmail.com" aria-label="Email"><Mail size={15} /></a>
            <a href="https://wa.me/252634594307?s=p" target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={15} /></a>
            <a href="https://www.linkedin.com/in/abdilahi-mohamed-564317393" target="_blank" rel="noreferrer" aria-label="LinkedIn"><ExternalLink size={15} /></a>
            <a href="https://github.com/Abdilahi-mohamed" target="_blank" rel="noreferrer" aria-label="GitHub"><ExternalLink size={15} /></a>
          </nav>
          <p>© 2026 CV Screening</p>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
