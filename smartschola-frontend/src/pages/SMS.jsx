import { useState, useEffect } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import client from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'

const TEMPLATES = [
  { label:'Results Available', text:'Dear Parent, your child\'s academic results are now available. Please visit the school or log in to the Smart Schola portal to view them.' },
  { label:'Fee Reminder', text:'Dear Parent, your child has an outstanding fee balance. Please settle at your earliest convenience to avoid disruption of studies.' },
  { label:'School Reopening', text:'Dear Parent, school reopens on Monday. Please ensure all fees are paid and your child comes with the required stationery.' },
  { label:'Custom Message', text:'' },
]

const statusBadge = (s) => {
  if(s==='delivered')return'bg-emerald-100 text-emerald-700'
  if(s==='failed')return'bg-red-100 text-red-700'
  return'bg-amber-100 text-amber-700'
}

export default function SMS() {
  const [recipients, setRecipients] = useState('all_parents')
  const [classInput, setClassInput] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [templateIdx, setTemplateIdx] = useState(0)
  const [message, setMessage] = useState(TEMPLATES[0].text)
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsLoading, setLogsLoading] = useState(true)
  const { addToast } = useToast()

  const fetchLogs = () => {
    setLogsLoading(true)
    client.get('/sms/log', { params: { per_page: 20 } })
      .then(r => { setLogs(r.data.logs); setLogsTotal(r.data.total) })
      .catch(() => {})
      .finally(() => setLogsLoading(false))
  }

  useEffect(() => { fetchLogs() }, [])

  const handleTemplate = (idx) => {
    setTemplateIdx(idx)
    if (TEMPLATES[idx].text) setMessage(TEMPLATES[idx].text)
    else setMessage('')
  }

  const handleSend = async () => {
    if (!message.trim()) { addToast('Please enter a message','warning'); return }
    if (recipients === 'custom' && !customPhone) { addToast('Enter a phone number','warning'); return }
    setSending(true)
    try {
      const payload = {
        recipients: recipients === 'specific_class' ? `class_${classInput}` : recipients,
        custom_phone: recipients === 'custom' ? customPhone : undefined,
        message
      }
      const r = await client.post('/sms/send', payload)
      addToast(`SMS sent to ${r.data.sent_count} recipients. ${r.data.failed_count > 0 ? `${r.data.failed_count} failed.` : ''}`, r.data.failed_count > 0 ? 'warning' : 'success')
      fetchLogs()
    } catch (err) { addToast(err.response?.data?.detail||'Send failed','error') }
    finally { setSending(false) }
  }

  return (
    <div className="p-6">
      <PageHeader title="SMS Center" subtitle="Send messages to parents and guardians" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compose */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-semibold text-base mb-4" style={{ color:'#0B1D3A' }}>Compose Message</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Recipients</label>
              <div className="space-y-2">
                {[
                  ['all_parents','All Parents'],
                  ['fee_defaulters','Fee Defaulters (Balance > 0)'],
                  ['specific_class','Specific Class'],
                  ['custom','Custom Number'],
                ].map(([val,label]) => (
                  <label key={val} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="radio" name="recipients" value={val} checked={recipients===val} onChange={() => setRecipients(val)}
                      className="w-4 h-4" style={{ accentColor:'#F5A623' }} />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              {recipients === 'specific_class' && (
                <input type="text" placeholder="Class name (e.g. 7A)" value={classInput} onChange={e => setClassInput(e.target.value)}
                  className="mt-2 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400" />
              )}
              {recipients === 'custom' && (
                <input type="tel" placeholder="+260 9X XXX XXXX" value={customPhone} onChange={e => setCustomPhone(e.target.value)}
                  className="mt-2 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400" />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Message Template</label>
              <select value={templateIdx} onChange={e => handleTemplate(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none">
                {TEMPLATES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</label>
                <span className={`text-xs font-medium ${message.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{message.length}/160</span>
              </div>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                rows={5} maxLength={320}
                placeholder="Type your message here..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-yellow-400"
              />
            </div>

            <button onClick={handleSend} disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition"
              style={{ background:'#0B1D3A' }}>
              {sending ? <LoadingSpinner size={16} color="white" /> : <Send size={16} />}
              {sending ? 'Sending...' : 'Send SMS'}
            </button>
          </div>
        </div>

        {/* SMS Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-display font-semibold text-base" style={{ color:'#0B1D3A' }}>Sent Log <span className="text-gray-300 font-normal text-sm ml-1">({logsTotal})</span></h2>
          </div>
          {logsLoading ? <div className="flex items-center justify-center py-20"><LoadingSpinner size={32} /></div>
          : logs.length === 0 ? <EmptyState icon={MessageSquare} title="No messages sent yet" description="Send your first SMS above." />
          : (
            <div className="flex-1 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{log.recipient_name || log.recipient_phone}</p>
                      <p className="text-xs text-gray-400">{log.recipient_phone}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{log.message.slice(0,80)}{log.message.length>80?'...':''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(log.status)}`}>{log.status}</span>
                      <p className="text-xs text-gray-300 mt-1">{new Date(log.sent_at).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
