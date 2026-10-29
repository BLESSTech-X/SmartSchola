import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, GraduationCap, MapPin, Search, ShieldCheck, School, LockKeyhole } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

export default function SchoolSignIn() {
  const [query, setQuery] = useState('')
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setLoadError('The school directory is not configured yet. Please try again later.')
      setLoading(false)
      return () => { active = false }
    }
    supabase.from('schools').select('id,name,slug,location').eq('status', 'verified').order('name')
      .then(({ data, error }) => {
        if (!active) return
        if (error) setLoadError('We could not load the registered school directory. Please try again shortly.')
        else setSchools(data || [])
      })
      .catch(() => { if (active) setLoadError('We could not load the registered school directory. Please try again shortly.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => schools.filter(s =>
    `${s.name} ${s.location || ''}`.toLowerCase().includes(query.toLowerCase())
  ), [schools, query])

  return <main className="school-signin-page">
    <header className="school-signin-topbar">
      <Link to="/" className="public-brand"><span className="public-brand-mark"><GraduationCap size={24}/></span><span><strong>SmartSchola</strong><small>Schools. Families. Futures.</small></span></Link>
      <Link to="/" className="school-signin-back"><ArrowLeft size={16}/> Back to home</Link>
    </header>
    <section className="school-signin-content">
      <div className="school-signin-heading">
        <span className="public-section-kicker"><ShieldCheck size={15}/> SECURE SCHOOL ACCESS</span>
        <h1>First, choose <span>your school.</span></h1>
        <p>Your sign-in is checked against the school you select. Only registered schools and accounts authorised by that school can grant access.</p>
      </div>
      <label className="school-signin-search"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find your school by name or location" aria-label="Search schools"/></label>
      {loading && <div className="school-signin-empty"><School size={26}/><h2>Loading registered schools…</h2><p>Checking the live school directory.</p></div>}
      {!loading && loadError && <div className="school-signin-empty" role="alert"><ShieldCheck size={26}/><h2>School directory unavailable</h2><p>{loadError}</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>}
      {!loading && !loadError && <div className="school-signin-list">
        {filtered.map(school => <article className="school-signin-card" key={school.id || school.slug}>
          <div className="school-signin-emblem blue"><School size={26}/><span>{school.name.split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase()}</span></div>
          <div className="school-signin-details"><span className="school-signin-type">REGISTERED SCHOOL</span><h2>{school.name}</h2><p><MapPin size={14}/>{school.location || 'Location not provided'}</p></div>
          <button type="button" className="school-signin-continue" onClick={() => navigate(`/login?school=${encodeURIComponent(school.slug)}`)}>Choose school <ArrowRight size={17}/></button>
        </article>)}
        {filtered.length === 0 && <div className="school-signin-empty"><Search size={26}/><h2>{schools.length ? 'No matching school found' : 'No registered schools are available yet'}</h2><p>{schools.length ? 'Check the spelling or ask your school administrator to confirm the registered school name.' : 'School sign-in will appear here when schools are registered and activated. Do not use a sample profile to sign in.'}</p>{query && <button type="button" onClick={() => setQuery('')}>Clear search</button>}</div>}
      </div>}
      <div className="school-signin-safety"><LockKeyhole size={18}/><p><strong>Security notice:</strong> choose only the school that issued your credentials. Only school-approved accounts can access private school information. Additional account-protection controls will be enabled before general launch.</p></div>
      <div className="school-signin-register">Is your school not on SmartSchola yet? <Link to="/register-school">School headmasters can start registration <ArrowRight size={14}/></Link></div>
    </section>
    <footer className="school-signin-footer">© {new Date().getFullYear()} SmartSchola · Schools. Families. Futures.</footer>
  </main>
}
