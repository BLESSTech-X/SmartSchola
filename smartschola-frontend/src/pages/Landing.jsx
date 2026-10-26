import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, ChevronRight, GraduationCap, HeartHandshake, LockKeyhole, Menu, Search, ShieldCheck, Sparkles, Users, X } from 'lucide-react'

const profilePreviews = [
  { name: 'BrainSmart School', location: 'Lusaka, Zambia', type: 'Primary & Secondary', slug: 'brainsmart-school', initials: 'BS', tone: 'blue', description: 'A sample school profile showing how each school can introduce its community, programmes and news.' },
  { name: 'Greenfield Learning Academy', location: 'Example profile', type: 'Primary School', slug: 'greenfield-academy', initials: 'GL', tone: 'green', description: 'An illustrative profile concept for a future participating school.' },
  { name: 'Horizon Preparatory School', location: 'Example profile', type: 'Early Learning & Primary', slug: 'horizon-preparatory', initials: 'HP', tone: 'purple', description: 'An illustrative profile concept for a future participating school.' },
]

const capabilities = [
  { icon: GraduationCap, title: 'A digital home for every school', text: 'Give your school its own branded profile for news, events, galleries, admissions information and contact details.', tone: 'gold' },
  { icon: BookOpen, title: 'School operations, connected', text: 'Bring student records, attendance, assessments, results and fee administration into one organised workspace.', tone: 'blue' },
  { icon: HeartHandshake, title: 'Parents stay connected', text: 'Give families a clear route to school notices, academic progress and authorised report downloads.', tone: 'green' },
  { icon: ShieldCheck, title: 'Access that respects privacy', text: 'Separate public school information from private student records, with access designed around each user’s role.', tone: 'purple' },
]

export default function Landing() {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const filtered = useMemo(() => profilePreviews.filter(s => `${s.name} ${s.location} ${s.type}`.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <div className="public-site">
      <header className="public-nav">
        <Link to="/" className="public-brand" aria-label="SmartSchola home">
          <span className="public-brand-mark"><GraduationCap size={24}/></span>
          <span><strong>SmartSchola</strong><small>Schools. Families. Futures.</small></span>
        </Link>
        <button className="public-menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X/> : <Menu/>}</button>
        <nav className={menuOpen ? 'public-nav-links open' : 'public-nav-links'}>
          <a href="#discover" onClick={() => setMenuOpen(false)}>Explore schools</a>
          <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
          <a href="#for-schools" onClick={() => setMenuOpen(false)}>For schools</a>
          <Link to="/login" className="public-login-link" onClick={() => setMenuOpen(false)}><LockKeyhole size={16}/> School sign in</Link>
          <a href="#for-schools" className="public-join-button" onClick={() => setMenuOpen(false)}>Join SmartSchola <ArrowRight size={16}/></a>
        </nav>
      </header>

      <main>
        <section className="public-hero">
          <div className="public-hero-orb orb-one"/><div className="public-hero-orb orb-two"/>
          <div className="public-hero-content">
            <div className="public-eyebrow"><Sparkles size={15}/> A connected community for education</div>
            <h1>Where every school<br/><span>has a place to shine.</span></h1>
            <p className="public-hero-copy">Discover schools, celebrate learning, and bring school life together. SmartSchola connects each school's public presence with the tools its people need behind the scenes.</p>
            <div className="public-hero-actions">
              <a href="#discover" className="public-button primary">Discover schools <ArrowRight size={18}/></a>
              <a href="#for-schools" className="public-button secondary">Bring your school <ChevronRight size={18}/></a>
            </div>
            <div className="public-trust-row"><span><CheckCircle2 size={16}/> Built for schools</span><span><ShieldCheck size={16}/> Privacy-first approach</span><span><Users size={16}/> Families included</span></div>
          </div>
          <div className="public-hero-visual" aria-label="Illustration of a connected school community">
            <div className="hero-window">
              <div className="hero-window-top"><span/><span/><span/><small>YOUR SCHOOL, YOUR SPACE</small></div>
              <div className="hero-school-banner"><div className="hero-school-emblem"><GraduationCap size={29}/></div><div><strong>Your School Name</strong><small>A community that grows together</small></div><span className="hero-verified"><ShieldCheck size={15}/> School profile</span></div>
              <div className="hero-window-grid"><div className="hero-mini-card hero-mini-feature"><div className="mini-image"><BookOpen size={28}/></div><small>ACADEMICS</small><strong>Learning with purpose</strong><span>Classes, subjects & progress</span></div><div className="hero-mini-card"><span className="mini-card-icon gold"><CalendarDays size={19}/></span><strong>School calendar</strong><small>Events & key dates</small><div className="mini-lines"><i/><i/><i/></div></div><div className="hero-mini-card"><span className="mini-card-icon green"><Users size={19}/></span><strong>Our community</strong><small>Families stay connected</small><div className="mini-avatars"><i>J</i><i>M</i><i>A</i><b>+</b></div></div></div>
              <div className="hero-window-footer"><span className="hero-live-dot"/> One school. One connected community.</div>
            </div>
            <div className="hero-floating-note"><span className="floating-note-icon"><HeartHandshake size={20}/></span><div><strong>Parents in the loop</strong><small>Progress, notices and reports</small></div></div>
            <div className="hero-floating-badge"><ShieldCheck size={16}/> Role-based access</div>
          </div>
        </section>

        <section className="public-discover section-wrap" id="discover">
          <div className="section-title-row"><div><span className="public-section-kicker">THE SCHOOL DIRECTORY</span><h2>Find your school community.</h2><p>Explore school profiles and see how SmartSchola can bring each school's story to life.</p></div><span className="directory-pill"><Users size={15}/> School profiles</span></div>
          <div className="school-search"><Search size={19}/><input aria-label="Search school profiles" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by school name, location or type..."/>{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={17}/></button>}</div>
          <div className="school-preview-grid">
            {filtered.map((school, i) => <article className="school-preview-card" key={school.slug}>
              <div className={`school-card-cover ${school.tone}`}><div className="school-cover-shape shape-a"/><div className="school-cover-shape shape-b"/><span className="school-initials">{school.initials}</span><span className="profile-preview-tag">PROFILE PREVIEW</span></div>
              <div className="school-card-body"><div className="school-card-meta"><span>{school.type}</span><span className="school-card-dot"/></div><h3>{school.name}</h3><p className="school-location">{school.location}</p><p className="school-description">{school.description}</p><Link to={`/s/${school.slug}`} className="school-card-link">View profile preview <ArrowRight size={16}/></Link></div>
            </article>)}
            {filtered.length === 0 && <div className="school-search-empty"><Search size={24}/><strong>No matching profile previews</strong><span>Try a different school name or location.</span></div>}
          </div>
          <p className="directory-note">The cards above are design previews, not a claim that these schools have registered. Live school listings will be populated from verified school accounts.</p>
        </section>

        <section className="public-platform section-wrap" id="platform">
          <div className="platform-heading"><span className="public-section-kicker">MORE THAN SCHOOL SOFTWARE</span><h2>One platform. Every part<br className="desktop-break"/> of school life, connected.</h2><p>SmartSchola is being built to serve the public school community and the private work that keeps a school running.</p></div>
          <div className="capability-grid">{capabilities.map(({icon: Icon,title,text,tone}) => <article className="capability-card" key={title}><span className={`capability-icon ${tone}`}><Icon size={22}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="public-school-cta" id="for-schools"><div className="cta-decoration cta-decoration-one"/><div className="cta-decoration cta-decoration-two"/><div className="school-cta-content"><span className="public-section-kicker">FOR SCHOOL LEADERS</span><h2>Give your school a home<br/>on SmartSchola.</h2><p>Build your school's digital presence and prepare to connect your team, learners and families in one place.</p><div className="cta-actions"><a className="public-button cta-primary" href="#discover">Explore profile previews <ArrowRight size={18}/></a><Link className="public-button cta-secondary" to="/login">School sign in</Link></div><small>School account registration and subscription activation will be introduced through the onboarding workflow.</small></div><div className="cta-side-card"><span className="cta-side-icon"><GraduationCap size={26}/></span><strong>Your school, recognised.</strong><p>A branded public profile, school announcements, events and a connected school workspace.</p><div><CheckCircle2 size={16}/> One school identity</div><div><CheckCircle2 size={16}/> One connected workspace</div><div><CheckCircle2 size={16}/> Different access for each role</div></div></section>
      </main>

      <footer className="public-footer"><Link to="/" className="public-brand"><span className="public-brand-mark"><GraduationCap size={22}/></span><span><strong>SmartSchola</strong><small>Schools. Families. Futures.</small></span></Link><p>Connecting schools, learners and families.</p><div><a href="#platform">About SmartSchola</a><a href="#for-schools">For schools</a><Link to="/login">School sign in</Link></div><small>© {new Date().getFullYear()} SmartSchola · Built for a connected school community.</small></footer>
    </div>
  )
}
