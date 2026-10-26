import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, ExternalLink, Facebook, GraduationCap, Images, Instagram, MapPin, Menu, Megaphone, Phone, ShieldCheck, Sparkles, Users, X } from 'lucide-react'

const profiles = {
  'brainsmart-school': {
    name: 'BrainSmart School', location: 'Lusaka, Zambia', type: 'Primary & Secondary', initials: 'BS',
    motto: 'Growing minds. Building futures.', about: 'A welcoming learning community committed to helping every learner grow in knowledge, character and confidence.',
    hero: [
      { title: 'A place to learn, belong and thrive.', text: 'Discover a school community where curiosity is encouraged and every learner is supported.', image: 'photo-1503676260728-1c00da094a0b', label: 'WELCOME TO OUR SCHOOL' },
      { title: 'Learning opens new possibilities.', text: 'Building strong foundations through creativity, collaboration and lifelong learning.', image: 'photo-1509062522246-3755977927d7', label: 'LEARNING IN ACTION' },
      { title: 'Every learner has a bright future.', text: 'A community of learners, teachers and families working together.', image: 'photo-1529390079861-591de354faf5', label: 'OUR SCHOOL COMMUNITY' }
    ],
    gallery: [
      { title: 'Learning together', image: 'photo-1509062522246-3755977927d7', category: 'Classroom' },
      { title: 'Curiosity in action', image: 'photo-1503676260728-1c00da094a0b', category: 'Learning' },
      { title: 'A welcoming campus', image: 'photo-1580582932707-520aed937b7b', category: 'Campus' },
      { title: 'Growing together', image: 'photo-1529390079861-591de354faf5', category: 'Community' },
      { title: 'Creative discoveries', image: 'photo-1427504494785-3a9ca7044f45', category: 'Activities' },
      { title: 'Ready for tomorrow', image: 'photo-1509062522246-3755977927d7', category: 'School life' }
    ]
  },
  'greenfield-academy': {
    name: 'Greenfield Learning Academy', location: 'School location', type: 'Primary School', initials: 'GL',
    motto: 'Learning for a brighter tomorrow.', about: 'An illustrative profile layout for a school to share its values, campus life and key information with families.',
    hero: [
      { title: 'Growing curious minds.', text: 'A school profile built to bring learning, community and families closer together.', image: 'photo-1503676260728-1c00da094a0b', label: 'WELCOME TO OUR SCHOOL' },
      { title: 'A community that learns together.', text: 'Celebrate the people and moments that make school life special.', image: 'photo-1509062522246-3755977927d7', label: 'OUR COMMUNITY' }
    ],
    gallery: [
      { title: 'Learning together', image: 'photo-1509062522246-3755977927d7', category: 'Classroom' },
      { title: 'Campus life', image: 'photo-1580582932707-520aed937b7b', category: 'Campus' },
      { title: 'Creative learning', image: 'photo-1427504494785-3a9ca7044f45', category: 'Activities' },
      { title: 'School community', image: 'photo-1529390079861-591de354faf5', category: 'Community' }
    ]
  },
  'horizon-preparatory': {
    name: 'Horizon Preparatory School', location: 'School location', type: 'Early Learning & Primary', initials: 'HP',
    motto: 'Curiosity today. Confidence tomorrow.', about: 'An illustrative profile layout showing how a school can share its learning approach, activities and information for families.',
    hero: [
      { title: 'Big beginnings start here.', text: 'A friendly space for families to explore school life and stay connected.', image: 'photo-1503676260728-1c00da094a0b', label: 'WELCOME TO OUR SCHOOL' },
      { title: 'A brighter journey of learning.', text: 'Discover the moments, milestones and people that shape each school day.', image: 'photo-1509062522246-3755977927d7', label: 'LEARNING EVERY DAY' }
    ],
    gallery: [
      { title: 'Discovering new ideas', image: 'photo-1503676260728-1c00da094a0b', category: 'Learning' },
      { title: 'A welcoming campus', image: 'photo-1580582932707-520aed937b7b', category: 'Campus' },
      { title: 'Learning by doing', image: 'photo-1427504494785-3a9ca7044f45', category: 'Activities' },
      { title: 'Growing together', image: 'photo-1529390079861-591de354faf5', category: 'Community' }
    ]
  }
}

const imageUrl = (id, width = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`

export default function SchoolProfile() {
  const { slug } = useParams()
  const school = profiles[slug]
  const [slide, setSlide] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [galleryFilter, setGalleryFilter] = useState('All')
  const [activeImage, setActiveImage] = useState(null)

  if (!school) return <main className="school-profile-not-found"><GraduationCap size={42}/><h1>School profile not found</h1><p>This profile may not be published yet.</p><Link to="/" className="public-button primary">Back to SmartSchola <ArrowRight size={17}/></Link></main>

  const current = school.hero[slide]
  const categories = ['All', ...new Set(school.gallery.map(item => item.category))]
  const gallery = galleryFilter === 'All' ? school.gallery : school.gallery.filter(item => item.category === galleryFilter)

  const scrollTo = (id) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const next = () => setSlide(value => (value + 1) % school.hero.length)
  const previous = () => setSlide(value => (value - 1 + school.hero.length) % school.hero.length)

  return <div className="school-profile-page brain-profile">
    <div className="school-utility-bar"><div className="school-utility-inner"><span><MapPin size={13}/>{school.location}</span><span className="school-utility-message">A connected school community on SmartSchola</span><div className="school-socials"><a href="#school-contact" aria-label="Facebook"><Facebook size={14}/></a><a href="#school-contact" aria-label="Instagram"><Instagram size={14}/></a><Link to="/" aria-label="SmartSchola community"><Users size={14}/></Link></div></div></div>
    <header className="school-brand-header">
      <Link to="/" className="school-back-community"><ArrowLeft size={15}/> School community</Link>
      <div className="school-crest"><span className={`school-crest-mark ${school.initials.toLowerCase()}`}><GraduationCap size={34}/></span><span className="school-crest-copy"><strong>{school.name}</strong><small>{school.motto}</small></span></div>
      <Link to={`/login?school=${slug}`} className="school-header-portal"><ShieldCheck size={16}/> Portal sign in <ArrowRight size={15}/></Link>
      <button className="school-mobile-menu-toggle" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close school menu' : 'Open school menu'}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>
    <nav className={`school-main-nav ${menuOpen ? 'open' : ''}`} aria-label="School sections">
      <button onClick={() => scrollTo('school-home')}>Home</button><button onClick={() => scrollTo('school-about')}>Our School <ChevronDown size={13}/></button><button onClick={() => scrollTo('school-news')}>News & Notices</button><button onClick={() => scrollTo('school-calendar')}>Calendar</button><button onClick={() => scrollTo('school-gallery')}>Gallery</button><button onClick={() => scrollTo('school-contact')}>Contact</button><Link to={`/login?school=${slug}`} className="school-nav-portal">Student & Parent Portal <ArrowRight size={14}/></Link>
    </nav>

    <section className="school-feature-hero" id="school-home" style={{backgroundImage:`linear-gradient(90deg,rgba(7,24,45,.84) 0%,rgba(7,24,45,.58) 45%,rgba(7,24,45,.12) 100%),url("${imageUrl(current.image, 2000)}")`}}>
      <div className="school-hero-grain"/><div className="school-hero-content"><span className="school-hero-kicker"><Sparkles size={14}/>{current.label}</span><h1>{current.title}</h1><p>{current.text}</p><div className="school-hero-actions"><button onClick={() => scrollTo('school-about')} className="school-btn-gold">Discover our school <ArrowRight size={17}/></button><Link to={`/login?school=${slug}`} className="school-btn-glass">School portal <ExternalLink size={16}/></Link></div></div>
      <div className="school-hero-caption"><span>{school.name}</span><span>{String(slide+1).padStart(2,'0')} <i/> {String(school.hero.length).padStart(2,'0')}</span></div>
      <div className="school-hero-controls"><button onClick={previous} aria-label="Previous slide"><ChevronLeft/></button><button onClick={next} aria-label="Next slide"><ChevronRight/></button></div>
      <div className="school-hero-dots">{school.hero.map((item,index)=><button key={item.title} className={index===slide?'active':''} onClick={()=>setSlide(index)} aria-label={`Show slide ${index+1}`}/>)}</div>
    </section>

    <div className="school-announcement-strip"><span className="school-announcement-tag"><Megaphone size={15}/> SCHOOL NOTICE</span><p>Stay connected — official school announcements and term updates will appear here when published by the school.</p><button onClick={() => scrollTo('school-news')}>View notices <ArrowRight size={14}/></button></div>

    <section className="school-quick-links" aria-label="Quick links"><button onClick={() => scrollTo('school-calendar')}><span className="quick-link-icon blue"><CalendarDays/></span><span><strong>School calendar</strong><small>Dates & events</small></span><ArrowRight/></button><button onClick={() => scrollTo('school-news')}><span className="quick-link-icon orange"><Megaphone/></span><span><strong>News & notices</strong><small>Latest updates</small></span><ArrowRight/></button><button onClick={() => scrollTo('school-gallery')}><span className="quick-link-icon green"><Images/></span><span><strong>Photo gallery</strong><small>Explore school life</small></span><ArrowRight/></button><Link to={`/login?school=${slug}`}><span className="quick-link-icon purple"><GraduationCap/></span><span><strong>Student & parent portal</strong><small>Learning information</small></span><ArrowRight/></Link></section>

    <main className="school-public-content">
      <section className="school-about-feature" id="school-about"><div className="school-about-image" style={{backgroundImage:`url("${imageUrl('photo-1580582932707-520aed937b7b',1000)}")`}}><span className="school-image-caption"><MapPin size={14}/>{school.location}</span></div><div className="school-about-copy"><span className="school-section-eyebrow">A PLACE TO BELONG</span><h2>Welcome to <em>{school.name}</em></h2><p>{school.about}</p><p>Explore our school community, discover upcoming events and keep up with the moments that matter. This profile is designed to bring school information together in one welcoming place.</p><div className="school-about-values"><span><span className="value-check">✓</span> Learner-centred community</span><span><span className="value-check">✓</span> Connected families</span><span><span className="value-check">✓</span> School news in one place</span></div><button className="school-text-link" onClick={() => scrollTo('school-contact')}>More about our school <ArrowRight size={16}/></button></div></section>

      <section className="school-news-section" id="school-news"><div className="school-section-heading"><div><span className="school-section-eyebrow">WHAT'S HAPPENING</span><h2>News & announcements</h2><p>Updates from around our school community.</p></div><span className="school-heading-icon"><Megaphone/></span></div><div className="school-news-grid"><article className="school-news-card featured"><div className="school-news-image" style={{backgroundImage:`url("${imageUrl('photo-1509062522246-3755977927d7',1000)}")`}}><span>School life</span></div><div className="school-news-body"><small><CalendarDays size={13}/> SCHOOL UPDATE</small><h3>Good things are happening in our learning community</h3><p>School-published stories, achievements and important notices will be shared with families here.</p><button onClick={() => scrollTo('school-contact')}>Stay connected <ArrowRight size={14}/></button></div></article><article className="school-news-card"><div className="school-news-image" style={{backgroundImage:`url("${imageUrl('photo-1427504494785-3a9ca7044f45',800)}")`}}><span>Learning</span></div><div className="school-news-body"><small><Sparkles size={13}/> LEARNING MOMENTS</small><h3>Celebrating curiosity and creativity</h3><p>A space for school highlights, activities and learner achievements.</p><button onClick={() => scrollTo('school-gallery')}>Explore gallery <ArrowRight size={14}/></button></div></article><article className="school-news-card school-news-text-card"><span className="school-news-icon"><Megaphone/></span><small>IMPORTANT INFORMATION</small><h3>Notices for families</h3><p>Term notices, reminders and school communications will be published here by authorised staff.</p><button onClick={() => scrollTo('school-calendar')}>View school dates <ArrowRight size={14}/></button></article></div></section>

      <section className="school-calendar-section" id="school-calendar"><div className="school-calendar-photo" style={{backgroundImage:`linear-gradient(90deg,rgba(11,31,55,.86),rgba(11,31,55,.38)),url("${imageUrl('photo-1503676260728-1c00da094a0b',1300)}")`}}><span className="school-section-eyebrow">PLAN AHEAD</span><h2>School calendar</h2><p>Keep important dates, school activities and community events close at hand.</p><button className="school-btn-gold" onClick={() => alert('The school calendar will display published dates once this profile is connected to the school workspace.')}>Explore calendar <ArrowRight size={16}/></button></div><div className="school-calendar-list"><div className="school-section-heading compact"><div><span className="school-section-eyebrow">SAVE THE DATE</span><h2>Upcoming events</h2></div><CalendarDays/></div><div className="school-event-empty"><span><CalendarDays size={23}/></span><div><strong>Events will appear here</strong><p>Official term dates, meetings and school activities will be shown once published.</p></div></div><div className="school-event-empty"><span><Clock3 size={23}/></span><div><strong>Term dates & reminders</strong><p>Families can check key dates here without searching through multiple messages.</p></div></div><button className="school-text-link" onClick={() => scrollTo('school-contact')}>Questions about school dates? <ArrowRight size={15}/></button></div></section>

      <section className="school-gallery-section" id="school-gallery"><div className="school-section-heading"><div><span className="school-section-eyebrow">LIFE AT OUR SCHOOL</span><h2>Moments worth sharing</h2><p>Explore the places, people and learning experiences that make up our school community.</p></div><span className="school-heading-icon"><Images/></span></div><div className="school-gallery-filters">{categories.map(category=><button key={category} onClick={()=>setGalleryFilter(category)} className={galleryFilter===category?'active':''}>{category}</button>)}</div><div className="school-photo-grid">{gallery.map((item,index)=><button key={item.title} className={`school-photo-tile tile-${index%6}`} onClick={()=>setActiveImage(item)} aria-label={`View ${item.title}`}><img src={imageUrl(item.image,850)} alt={item.title} loading="lazy"/><span className="school-photo-overlay"><small>{item.category}</small><strong>{item.title}</strong><span className="school-photo-open"><Images size={17}/></span></span></button>)}</div><div className="school-gallery-footer"><span><ShieldCheck size={16}/> Gallery images are illustrative until the school publishes its own photographs.</span><button onClick={() => setGalleryFilter('All')}>View all photos <ArrowRight size={15}/></button></div></section>

      <section className="school-family-cta"><div className="school-family-cta-image" style={{backgroundImage:`url("${imageUrl('photo-1529390079861-591de354faf5',900)}")`}}/><div className="school-family-cta-copy"><span className="school-section-eyebrow">STAY CONNECTED</span><h2>School and home, closer together.</h2><p>Authorised school staff can manage school information. Learners and parents will use secure accounts to access the services made available to them.</p><Link to={`/login?school=${slug}`} className="school-btn-gold">Go to school portal <ArrowRight size={16}/></Link></div></section>
    </main>

    <footer className="school-profile-footer" id="school-contact"><div className="school-footer-main"><div className="school-footer-brand"><div className="school-footer-crest"><GraduationCap size={28}/></div><h3>{school.name}</h3><p>{school.motto}</p><span><MapPin size={14}/>{school.location}</span></div><div className="school-footer-column"><h4>Explore</h4><button onClick={() => scrollTo('school-about')}>About our school</button><button onClick={() => scrollTo('school-news')}>News & announcements</button><button onClick={() => scrollTo('school-gallery')}>Photo gallery</button><button onClick={() => scrollTo('school-calendar')}>School calendar</button></div><div className="school-footer-column"><h4>School community</h4><Link to={`/login?school=${slug}`}>Teacher & staff access</Link><Link to={`/login?school=${slug}`}>Student & parent portal</Link><Link to="/">Discover other schools</Link></div><div className="school-footer-contact"><h4>Stay connected</h4><p>Official school contact details will appear here when published by the school.</p><Link to={`/login?school=${slug}`} className="school-footer-portal">Portal sign in <ArrowRight size={15}/></Link></div></div><div className="school-footer-bottom"><span>© {new Date().getFullYear()} {school.name}. School information is managed by authorised representatives.</span><Link to="/">Powered by <strong>SmartSchola</strong></Link></div></footer>

    {activeImage && <div className="school-lightbox" role="dialog" aria-modal="true" aria-label={activeImage.title} onClick={() => setActiveImage(null)}><button className="school-lightbox-close" onClick={() => setActiveImage(null)} aria-label="Close image"><X/></button><button className="school-lightbox-download" onClick={e => {e.stopPropagation();window.open(imageUrl(activeImage.image,1600),'_blank','noopener,noreferrer')}} aria-label="Open full image"><Download/></button><img src={imageUrl(activeImage.image,1600)} alt={activeImage.title} onClick={e=>e.stopPropagation()}/><div className="school-lightbox-caption"><small>{activeImage.category}</small><strong>{activeImage.title}</strong></div></div>}
  </div>
}
