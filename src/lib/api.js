const STORAGE_KEY = 'arciaga.session'
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').trim().replace(/\/+$/, '')
let session = null
try { session = JSON.parse(sessionStorage.getItem(STORAGE_KEY)) } catch { sessionStorage.removeItem(STORAGE_KEY) }
let refreshPromise = null

export class ApiError extends Error {
  constructor(message, status = 0, errors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export function hasSession() { return Boolean(session?.access_token && session?.refresh_token) }
function saveSession(tokens) {
  session = tokens
  if (tokens) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  else sessionStorage.removeItem(STORAGE_KEY)
}
function expireSession() {
  saveSession(null)
  window.dispatchEvent(new Event('arciaga:session-expired'))
}
async function send(path, { method = 'GET', body, token } = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(60000),
    })
  } catch {
    throw new ApiError('Cannot reach the API. Check your connection and make sure the backend is running.')
  }
  let data
  try { data = await response.json() }
  catch { throw new ApiError('The API returned an unexpected response. Check the backend configuration.', response.status) }
  if (!response.ok) throw new ApiError(data.error || 'The request could not be completed.', response.status, data.errors || {})
  return data
}
async function refresh() {
  if (!refreshPromise) {
    refreshPromise = send('/auth/refresh', { method: 'POST', body: { refresh_token: session?.refresh_token } })
      .then((data) => { saveSession(data.tokens) })
      .catch((error) => {
        // A transient network/server error should not destroy a recoverable session.
        if (error.status === 401 || error.status === 403) expireSession()
        throw error
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}
async function request(path, options = {}) {
  if (!hasSession()) { expireSession(); throw new ApiError('Please sign in to continue.', 401) }
  try { return await send(path, { ...options, token: session.access_token }) }
  catch (error) {
    if (error.status !== 401) throw error
    await refresh()
    try { return await send(path, { ...options, token: session.access_token }) }
    catch (retryError) { if (retryError.status === 401) expireSession(); throw retryError }
  }
}
export const api = {
  async login(identity, password) {
    const data = await send('/auth/login', { method: 'POST', body: { identity, password } })
    saveSession(data.tokens)
    return data.user
  },
  async logout() {
    await request('/auth/logout', { method: 'POST', body: {} })
    saveSession(null)
  },
  async me() { return (await request('/auth/me')).user },
  async products() { return (await request('/products')).data },
  async createProduct(product) { return (await request('/products', { method: 'POST', body: product })).data },
  async updateProduct(id, product) { return (await request(`/products/${id}`, { method: 'PUT', body: product })).data },
  async deleteProduct(id) { return request(`/products/${id}`, { method: 'DELETE' }) },
}
