export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div className="page-heading-copy">
        <p className="page-heading-kicker">SMARTSCHOLA WORKSPACE</p>
        <h1>{title}</h1>
        {subtitle && <p className="page-heading-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  )
}
