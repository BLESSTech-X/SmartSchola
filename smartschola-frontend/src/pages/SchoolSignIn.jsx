import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, GraduationCap, MapPin, Search, ShieldCheck, School, LockKeyhole } from 'lucide-react'

const schools = [
  { name: 'BrainSmart School', location: 'Lusaka, Zambia', type: 'Primary & Secondary', slug: 'brainsmart-school', initials: 'BS', tone: 'blue', status: 'Profile preview' },
  { name: 'Greenfield Learning Academy', location: 'School location', type: 'Primary School', slug: 'greenfield-academy', initials: 'GL', tone: 'green', status: 'Profile preview' },
  { name: 'Horizon Preparatory School', location: 'School location', type: 'Early Learning & Primary', slug: 'horizon-preparatory', initials: 'HP', tone: 'purple', status: 'Profile preview' },
]

export default function SchoolSignIn() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const filtered = useMemo(() => schools.filter(s => `${s.name} ${s.location} ${s.type}`.toLowerCase().includes(query.toLowerCase())), [query])

  return <main className="school-signin-page">
    <header className="school-signin-topbar">
      <Link to="/" className="public-brand"><span className="public-brand-mark"><GraduationCap size={24}/></span><span><strong>SmartSchola</strong><small>Schools. Families. Futures.</small></span></Link>
      <Link to="/" className="school-signin-back"><ArrowLeft size={16}/> Back to home</Link>
    </header>
    <section className="school-signin-content">
      <div className="school-signin-heading">
        <span className="public-section-kicker"><ShieldCheck size={15}/> SECURE SCHOOL ACCESS</span>
        <h1>First, choose <span>your school.</span></h1>
        <p>School access is tied to a specific school. Select the school that issued your credentials before continuing to sign in.</p>
      </div>
      <label className="school-signin-search"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find your school by name or location" aria-label="Search schools"/></label>
      <div className="school-signin-list">
        {filtered.map(school => <article className="school-signin-card" key={school.slug}>
          <div className={`school-signin-emblem ${school.tone}`}><School size={26}/><span>{school.initials}</span></div>
          <div className="school-signin-details"><span className="school-signin-type">{school.type}</span><h2>{school.name}</h2><p><MapPin size={14}/>{school.location}</p><span className="school-signin-preview-tag">{school.status}</span></div>
          <button type="button" className="school-signin-continue" onClick={() => navigate(`/login?school=${school.slug}`)}>Choose school <ArrowRight size={17}/></button>
        </article>)}
        {filtered.length === 0 && <div className="school-signin-empty"><Search size={26}/><h2>No matching school found</h2><p>Check the spelling or ask your school administrator to confirm the school name.</p><button type="button" onClick={() => setQuery('')}>Clear search</button></div>}
      </div>
      <div className="school-signin-safety"><LockKeyhole size={18}/><p><strong>Important:</strong> only choose the school that issued your login details. If your school is not listed, do not sign in through another school.</p></div>
      <div className="school-signin-register">Is your school not on SmartSchola yet? <Link to="/#for-schools">School headmasters can start registration <ArrowRight size={14}/></Link></div>
    </section>
    <footer className="school-signin-footer">© {new Date().getFullYear()} SmartSchola · Schools. Families. Futures.</footer>
  </main>
}
