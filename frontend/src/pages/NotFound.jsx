import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="text-center text-white fade-in">
        <GraduationCap size={48} className="text-gold mx-auto mb-6" />
        <h1 className="font-display text-6xl font-bold text-gold mb-4">404</h1>
        <h2 className="font-display text-2xl font-bold mb-3">Page Not Found</h2>
        <p className="text-white/50 text-sm mb-8 max-w-xs mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 bg-gold text-navy px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gold-600 transition-all">← Back to Dashboard</Link>
      </div>
    </div>
  )
}
