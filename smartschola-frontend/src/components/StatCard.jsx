import LoadingSpinner from './LoadingSpinner.jsx'

export default function StatCard({ icon: Icon, label, value, sub, color = '#0B1D3A', loading = false }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
          {loading ? (
            <div className="mt-2"><LoadingSpinner size={24} /></div>
          ) : (
            <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
          )}
          {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  )
}
