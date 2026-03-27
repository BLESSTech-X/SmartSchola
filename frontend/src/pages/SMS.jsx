import React, { useState, useEffect } from 'react'
import { Send, MessageSquare, Clock } from 'lucide-react'
import { LoadingSpinner } from '../components/index'
import { useToast } from '../context/ToastContext'
import client from '../api/client'

const TEMPLATES = [
  { label: 'Results Available', text: 'Dear Parent, your child\'s academic results are now available. Please visit the school to collect the report slip.' },
  { label: 'Outstanding Fee Balance', text: 'Dear Parent, your child has an outstanding school fee balance. Please visit the school to settle the balance at your earliest convenience.' },
  { label: 'School Reopening', text: 'Dear Parent, the school reopens next Monday. Please ensure all fees are paid before the first day of term.' },
  { label: 'Custom Message', text: '' },
]

export default function SMS() {
  const [recipients, setRecipients] = useState('all_parents')
  const [className, setClassName] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [message, setMessage] = useState(TEMPLATES[0].text)
  const [template, setTemplate] = useState(0)
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    client.get('/sms/log').then(r => setLogs(r.data.logs || [])).catch(() => {}).finally(() => setLoadingLogs(false))
  }, [])

  const handleTemplate = (i) => {
    setTemplate(i)
    if (TEMPLATES[i].text) setMessage(TEMPLATES[i].text)
  }

  const handleSend = async () => {
    if (!message.trim()) { addToast('Message cannot be empty', 'warning'); return }
    if (message.length > 160) { addToast('Message exceeds 160 characters', 'warning'); return }
    setSending(true)
    try {
      const { data } = await client.post('/sms/send', { recipients, class_name: className, custom_phone: customPhone, message })
      addToast(`Sent ${data.sent} message${data.sent !== 1 ? 's' : ''}${data.failed > 0 ? ` (${data.failed} failed)` : ''}`, 'success')
      const logsRes = await client.get('/sms/log')
      setLogs(logsRes.data.logs || [])
    } catch (err) { addToast(err.response?.data?.detail || 'Failed to send', 'error') }
    finally { setSending(false) }
  }

  const statusColors = { delivered: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', logged: 'bg-gray-100 text-gray-600' }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-6">
        <h1 className="font-display text-navy text-2xl lg:text-3xl font-bold">SMS Center</h1>
        <p className="text-gray-500 text-sm mt-0.5">Send messages to parents via Africa's Talking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-display text-navy text-lg font-semibold mb-5 flex items-center gap-2"><Send size={18} className="text-gold" /> Compose</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Recipients</label>
              <div className="space-y-2">
                {[['all_parents','All Parents'],['fee_defaulters','Fee Defaulters'],['class_name','Specific Class'],['custom','Custom Number']].map(([val, label]) => (
                  <label key={val} className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all ${recipients===val?'bg-navy/5 border border-navy/20':'border border-transparent hover:bg-gray-50'}`}>
                    <input type="radio" checked={recipients===val} onChange={() => setRecipients(val)} className="accent-navy" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              {recipients === 'class_name' && (
                <input value={className} onChange={e => setClassName(e.target.value)} placeholder="Class name (e.g. 7A)" className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
              )}
              {recipients === 'custom' && (
                <input value={customPhone} onChange={e => setCustomPhone(e.target.value)} placeholder="+260 97X XXX XXX" className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Message Template</label>
              <select value={template} onChange={e => handleTemplate(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40">
                {TEMPLATES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</label>
                <span className={`text-xs font-medium ${message.length > 160 ? 'text-red-500' : message.length > 140 ? 'text-yellow-500' : 'text-gray-400'}`}>{message.length}/160</span>
              </div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none" />
            </div>

            <button onClick={handleSend} disabled={sending || !message.trim()} className="w-full flex items-center justify-center gap-2 bg-navy text-white py-3 rounded-xl font-medium text-sm hover:bg-navy-400 transition-all disabled:opacity-60">
              {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={15} /> Send SMS</>}
            </button>
          </div>
        </div>

        {/* Log */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-display text-navy text-lg font-semibold mb-5 flex items-center gap-2"><Clock size={18} className="text-gold" /> Message Log</h2>
          {loadingLogs ? <LoadingSpinner className="py-8" /> : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm"><MessageSquare size={32} className="mx-auto mb-3 text-gray-200" />No messages sent yet</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {logs.map(l => (
                <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-navy truncate">{l.recipient_name || l.recipient_phone}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{l.recipient_phone}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{l.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(l.sent_at).toLocaleString()}</p>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[l.status] || 'bg-gray-100 text-gray-600'}`}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
