const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function getAccessToken() {
  return localStorage.getItem('token') || ''
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE) throw new Error('SmartSchola API is not configured. Set VITE_API_URL to the deployed Worker URL.')
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const token = options.token ?? getAccessToken()
  if (token) headers.set('Authorization', 'Bearer ' + token)
  const response = await fetch(API_BASE + path, { ...options, headers })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.detail || payload.message || 'The request could not be completed.')
  return payload
}

export const apiConfigured = Boolean(API_BASE)
