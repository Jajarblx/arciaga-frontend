import { useState } from 'react'
import Icon from './Icon'
import { api } from '../lib/api'
export default function Login({ onLogin, notice = '' }) {
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (!identity.trim() || !password) { setError('Enter your username or email and password.'); return }
    setBusy(true); setError('')
    try { onLogin(await api.login(identity.trim(), password)) }
    catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  return <main className="login-layout">
    <section className="login-story">
      <a className="brand" href="#" aria-label="Arciaga Inventory home"><span className="brand-mark"><Icon name="box" size={25}/></span><span>arciaga<span className="brand-caption">INVENTORY STUDIO</span></span></a>
      <div className="story-content"><span className="pill"><span className="dot"/> A little clarity. A lot of possibility.</span><h1>Your products.<br/>Your space.<br/><span className="gradient-text">All in focus.</span></h1><p>A calmer way to manage your inventory. Bring your products, prices, and stock together in one beautifully simple workspace.</p>
      <div className="story-art" aria-hidden="true"><div className="art-orbit"/><div className="glass floating-card"><div className="art-card-top"><span className="mini-box"><Icon name="box" size={27}/></span><span className="badge in-stock">In stock</span></div><span className="art-label">YOUR NEXT CHAPTER</span><h3>Room to grow.</h3><div className="art-bars">{[32,45,37,62,52,78,92].map((height, i) => <span key={i} style={{ height: `${height}%` }}/>)}</div><div className="art-footer"><span>Less friction</span><Icon name="trend"/><span>More focus</span></div></div><div className="glass art-bubble"><span className="bubble-check"><Icon name="check"/></span><span>Everything in its place.</span></div></div>
      </div><p className="story-footer">Built for everyday inventory, designed for you.</p>
    </section>
    <section className="glass login-card" aria-labelledby="login-title"><div className="login-icon"><Icon name="lock" size={26}/></div><p className="eyebrow">YOUR WORKSPACE AWAITS</p><h2 id="login-title">Welcome back.</h2><p className="muted">Sign in to keep things moving.</p>
      {notice && <div className="alert info" role="status">{notice}</div>}
      {error && <div className="alert error" role="alert"><Icon name="warning"/><span>{error}</span></div>}
      <form onSubmit={submit}>
        <label htmlFor="identity">Username or email</label><div className="input-icon"><Icon name="mail"/><input id="identity" name="identity" autoComplete="username" placeholder="Enter your username or email" value={identity} onChange={(event) => setIdentity(event.target.value)} disabled={busy} required/></div>
        <label htmlFor="password">Password</label><div className="input-icon password-input"><Icon name="lock"/><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} required/><button type="button" className="icon-button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}><Icon name="eye"/></button></div>
        <div className="login-security"><Icon name="lock" size={14}/><span>Your workspace is protected by authentication.</span></div>
        <button className="button primary login-submit" disabled={busy}>{busy ? <><span className="spinner"/> Signing in…</> : <>Sign in to your workspace <Icon name="arrow"/></>}</button>
      </form><p className="login-bottom">Need access? Contact your workspace administrator.</p>
    </section>
  </main>
}
