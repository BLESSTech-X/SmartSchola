import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info }
  const colors = {
    success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
    error: 'bg-red-50 border-red-400 text-red-800',
    warning: 'bg-amber-50 border-amber-400 text-amber-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800'
  }
  const iconColors = { success: 'text-emerald-500', error: 'text-red-500', warning: 'text-amber-500', info: 'text-blue-500' }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(toast => {
          const Icon = icons[toast.type]
          return (
            <div key={toast.id} className={`toast-enter flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg ${colors[toast.type]}`}>
              <Icon size={18} className={`mt-0.5 flex-shrink-0 ${iconColors[toast.type]}`} />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
