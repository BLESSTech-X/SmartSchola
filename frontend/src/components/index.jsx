// Modal.jsx
import React from 'react'
import { X } from 'lucide-react'

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} fade-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-display text-navy text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// EmptyState.jsx
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center mb-4 text-navy/30">
        {icon}
      </div>
      <h3 className="font-display text-navy text-lg font-semibold mb-1">{title}</h3>
      <p className="text-gray-500 text-sm max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// LoadingSpinner.jsx
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-2 border-navy/20 border-t-gold rounded-full animate-spin`} />
    </div>
  )
}

// StatCard.jsx
export function StatCard({ icon, label, value, sub, color = 'navy', trend }) {
  const colors = {
    navy: 'from-navy to-navy-400 text-white',
    gold: 'bg-gold/10 text-navy border border-gold/30',
    green: 'bg-green-50 text-green-800 border border-green-200',
    red: 'bg-red-50 text-red-800 border border-red-200',
    blue: 'bg-blue-50 text-blue-800 border border-blue-200',
  }
  const isGradient = color === 'navy'

  return (
    <div className={`rounded-2xl p-5 ${isGradient ? `bg-gradient-to-br ${colors[color]}` : colors[color]} fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGradient ? 'bg-white/10' : 'bg-white'}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isGradient ? 'bg-white/20 text-white' : 'bg-white text-gray-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className={`text-2xl font-display font-bold ${isGradient ? 'text-white' : ''}`}>{value}</p>
      <p className={`text-sm font-medium mt-0.5 ${isGradient ? 'text-white/80' : 'opacity-70'}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${isGradient ? 'text-white/60' : 'opacity-50'}`}>{sub}</p>}
    </div>
  )
}

// PinInput.jsx
export function PinInput({ value = '', onChange, disabled = false }) {
  const digits = (value + '      ').slice(0, 6).split('')

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const arr = (value + '      ').slice(0, 6).split('')
    arr[i] = val || ' '
    const newVal = arr.join('').trimEnd()
    onChange(newVal)
    if (val) {
      const next = document.getElementById(`pin-${i + 1}`)
      if (next) next.focus()
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i].trim()) {
      const arr = (value + '      ').slice(0, 6).split('')
      if (i > 0) {
        arr[i - 1] = ' '
        onChange(arr.join('').trimEnd())
        const prev = document.getElementById(`pin-${i - 1}`)
        if (prev) prev.focus()
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
  }

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          id={`pin-${i}`}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
            ${digits[i].trim()
              ? 'border-navy bg-navy/5 text-navy'
              : 'border-gray-200 bg-gray-50 text-gray-400'
            }
            focus:border-gold focus:bg-gold/5
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  )
}
