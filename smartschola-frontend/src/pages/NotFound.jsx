import { useNavigate } from 'react-router-dom'
export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <p className="text-7xl font-display font-black" style={{ color:'#0B1D3A' }}>404</p>
      <p className="text-gray-400 mt-2 mb-6">Page not found</p>
      <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background:'#0B1D3A' }}>Go Home</button>
    </div>
  )
}
