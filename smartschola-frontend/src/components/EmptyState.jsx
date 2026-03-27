export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(11,29,58,0.06)' }}>
        {Icon && <Icon size={32} className="text-gray-400" />}
      </div>
      <h3 className="font-display font-semibold text-gray-700 text-lg mb-1">{title}</h3>
      {description && <p className="text-gray-400 text-sm max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#0B1D3A' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
