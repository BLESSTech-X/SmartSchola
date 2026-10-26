import LoadingSpinner from './LoadingSpinner.jsx'

export default function StatCard({ icon: Icon, label, value, sub, color = '#214A82', loading = false }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-icon" style={{ '--stat-color': color }}><Icon size={20} strokeWidth={2}/></span>
        <span className="stat-card-mark"><ArrowMark /></span>
      </div>
      <p className="stat-card-label">{label}</p>
      {loading ? <div className="stat-card-loading"><LoadingSpinner size={23}/></div> : <p className="stat-card-value">{value}</p>}
      {sub && <p className="stat-card-sub">{sub}</p>}
    </article>
  )
}
function ArrowMark() { return <span aria-hidden="true">↗</span> }
