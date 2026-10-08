import react from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const value = env.VITE_API_URL?.trim()
  if (command === 'build' && !value) throw new Error('Set VITE_API_URL before building. Copy .env.example for local testing; use your backend HTTPS URL ending in /api on Render.')
  if (value) {
    let url
    try { url = new URL(value) } catch { throw new Error('VITE_API_URL must be a full URL ending in /api.') }
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname.replace(/\/+$/, '') !== '/api') throw new Error('VITE_API_URL must be a full HTTP(S) URL ending in /api, without credentials, a query, or a fragment.')
    if (!local && url.protocol !== 'https:') throw new Error('Use HTTPS for the deployed API.')
    if (env.RENDER === 'true' && (local || url.protocol !== 'https:')) throw new Error('Render builds must use your deployed HTTPS backend, not localhost.')
  }
  return { plugins: [react()], server: { port: 5173, strictPort: true } }
})
