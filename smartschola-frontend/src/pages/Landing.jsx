import { useEffect, useMemo, useState } from 'react'
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
  const [heroSlide, setHeroSlide] = useState(0)
  const navigate = useNavigate()
  useEffect(() => { const timer = window.setInterval(() => setHeroSlide(value => (value + 1) % 4), 4800); return () => window.clearInterval(timer) }, [])
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
          <a href="#discover" onClick={() => setMenuOpen(false)}>Find a school</a>
          <a href="#platform" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#benefits" onClick={() => setMenuOpen(false)}>Platform features</a>
          <a href="#for-schools" onClick={() => setMenuOpen(false)}>For school leaders</a>
          <Link to="/school-sign-in" className="public-login-link" onClick={() => setMenuOpen(false)}><LockKeyhole size={16}/> Sign in</Link>
          <a href="#for-schools" className="public-join-button" onClick={() => setMenuOpen(false)}>Headmaster: register your school <ArrowRight size={17}/></a>
        </nav>
      </header>

      <main>
        <section className="public-hero">
          <div className={`hero-copy-slideshow slide-${heroSlide}`} aria-hidden="true">
            {[
              ['photo-1509062522246-3755977927d7','Learning together'],
              ['photo-1577896851231-70ef18881754','Teachers inspiring learners'],
              ['photo-1529390079861-591de354faf5','A connected school community'],
              ['photo-1503676260728-1c00da094a0b','Every learner can shine']
            ].map(([image, label], index) => <div key={image} className={`hero-copy-slide ${heroSlide === index ? 'active' : ''}`} style={{backgroundImage:`linear-gradient(90deg,rgba(245,249,255,.96),rgba(245,249,255,.82) 48%,rgba(245,249,255,.35)),url(https://images.unsplash.com/${image}?auto=format&fit=crop&w=1400&q=80)`}}><span>{label}</span></div>)}
          </div>
          <div className="hero-copy-slide-indicators" aria-label="Hero image controls">{[0,1,2,3].map(index => <button key={index} type="button" className={heroSlide === index ? 'active' : ''} onClick={() => setHeroSlide(index)} aria-label={`Show school image ${index + 1}`} />)}</div>
          <div className="public-hero-orb orb-one"/><div className="public-hero-orb orb-two"/>
          <div className="public-hero-content">
            <div className="public-eyebrow"><Sparkles size={15}/> A connected community for education</div>
            <h1>Where every school<br/><span>has a place to shine.</span></h1>
            <p className="public-hero-copy">Discover schools, celebrate learning, and bring school life together. SmartSchola connects each school's public presence with the tools its people need behind the scenes. Each school is managed by its own authorised leadership.</p>
            <div className="public-hero-actions">
              <a href="#discover" className="public-button primary">Explore schools <ArrowRight size={18}/></a>
              <a href="#for-schools" className="public-button secondary">Register your school <ChevronRight size={18}/></a>
            </div>
            <div className="public-trust-row"><span><CheckCircle2 size={16}/> Built for schools</span><span><ShieldCheck size={16}/> Privacy-first approach</span><span><Users size={16}/> Families included</span></div>
          </div>
          <div className="public-hero-visual public-hero-photo-showcase" aria-label="Illustrative school life photo showcase">
            <div className="showcase-photo showcase-photo-main"><img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1100&q=85" alt="Students learning together in a bright classroom" loading="eager"/><div className="showcase-photo-caption"><span>LEARNING TOGETHER</span><strong>Every learner has a future.</strong></div></div>
            <div className="showcase-photo showcase-photo-top"><img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=650&q=85" alt="Teacher supporting students in class" loading="eager"/><span className="showcase-floating-label"><BookOpen size={15}/> Learning & growth</span></div>
            <div className="showcase-photo showcase-photo-bottom"><img src="https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=650&q=85" alt="School children learning and working together" loading="eager"/><span className="showcase-floating-label"><Users size={15}/> Stronger communities</span></div>
            <div className="showcase-trust-chip"><ShieldCheck size={18}/><span><strong>One connected school</strong><small>People, progress and possibility</small></span></div>
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
          <div className="capability-grid" id="benefits">{capabilities.map(({icon: Icon,title,text,tone}) => <article className="capability-card" key={title}><span className={`capability-icon ${tone}`}><Icon size={22}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="public-school-cta" id="for-schools"><div className="cta-decoration cta-decoration-one"/><div className="cta-decoration cta-decoration-two"/><div className="school-cta-content"><span className="public-section-kicker">FOR SCHOOL LEADERS</span><h2>Give your school a home<br/>on SmartSchola.</h2><p>Build your school's digital presence and prepare to connect your team, learners and families in one place.</p><div className="cta-actions"><a className="public-button cta-primary" href="mailto:singbless89@gmail.com?subject=SmartSchola%20School%20Registration%20Enquiry">Register your school <ArrowRight size={18}/></a><Link className="public-button cta-secondary" to="/school-sign-in">Sign in to a school</Link></div><small>School registration is separate from sign-in and is reserved for headmasters or verified school owners.</small></div><div className="cta-side-card"><span className="cta-side-icon"><GraduationCap size={26}/></span><strong>Your school, recognised.</strong><p>A branded public profile and a private workspace controlled by your authorised school leadership.</p><div><CheckCircle2 size={16}/> One school identity</div><div><CheckCircle2 size={16}/> One connected workspace</div><div><CheckCircle2 size={16}/> Different access for each role</div></div></section>
      </main>

      <nav className="public-bottom-nav" aria-label="Quick navigation"><Link to="/" className="active"><GraduationCap size={18}/><span>Home</span></Link><a href="#discover"><Search size={18}/><span>Schools</span></a><a href="#platform"><BookOpen size={18}/><span>Features</span></a><a href="#for-schools"><Users size={18}/><span>For schools</span></a><Link to="/school-sign-in"><LockKeyhole size={18}/><span>Sign in</span></Link></nav>
      <footer className="public-footer"><Link to="/" className="public-brand"><span className="public-brand-mark"><GraduationCap size={22}/></span><span><strong>SmartSchola</strong><small>Schools. Families. Futures.</small></span></Link><p>Connecting schools, learners and families.</p><div><a href="#platform">About SmartSchola</a><a href="#discover">School directory</a><a href="#for-schools">Register a school</a><Link to="/school-sign-in">Sign in to a school</Link></div><small>© {new Date().getFullYear()} SmartSchola · Built for a connected school community.</small></footer>
    </div>
  )
}
