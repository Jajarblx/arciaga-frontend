import { useEffect, useState } from 'react'
import { api, hasSession } from './lib/api'
import Icon from './components/Icon'
import Login from './components/Login'
import Modal from './components/Modal'
import ProductForm from './components/ProductForm'
import './App.css'

const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
const integer = new Intl.NumberFormat('en-PH')
const statusFor = (quantity) => quantity === 0 ? 'Out of stock' : quantity <= 10 ? 'Low stock' : 'In stock'
const statusClass = (quantity) => quantity === 0 ? 'out-stock' : quantity <= 10 ? 'low-stock' : 'in-stock'
const dateFor = (value) => new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

export default function App() {
  const [user, setUser] = useState(null)
  const [restoring, setRestoring] = useState(hasSession)
  const [restoreError, setRestoreError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let active = true
    function ended() { if (active) { setUser(null); setNotice('Your session has ended. Please sign in again.'); setRestoring(false); setRestoreError('') } }
    window.addEventListener('arciaga:session-expired', ended)
    if (hasSession()) {
      api.me().then((account) => { if (active) setUser(account) }).catch((error) => { if (active && hasSession()) setRestoreError(error.message) }).finally(() => { if (active) setRestoring(false) })
    }
    return () => { active = false; window.removeEventListener('arciaga:session-expired', ended) }
  }, [])
  if (restoring) return <div className="full-screen"><div className="glass loading-card"><span className="spinner"/><p>Opening your workspace…</p></div></div>
  if (restoreError && !user) return <div className="full-screen"><div className="glass loading-card"><Icon name="warning" size={32}/><h2>Let’s reconnect.</h2><p role="alert">{restoreError}</p><button className="button primary" onClick={() => window.location.reload()}><Icon name="refresh"/> Retry connection</button></div></div>
  if (!user) return <Login notice={notice} onLogin={(account) => { setNotice(''); setUser(account) }}/>
  return <Dashboard user={user} onLogout={() => { setUser(null); setNotice('You have been signed out. See you next time.') }}/>
}

function Dashboard({ user, onLogout }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState('')
  const [toast, setToast] = useState('')
  useEffect(() => {
    let active = true
    api.products().then((items) => { if (active) { setProducts(items); setError('') } }).catch((failure) => { if (active) setError(failure.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timer)
  }, [toast])
  async function reload() {
    setLoading(true); setError('')
    try { setProducts(await api.products()) }
    catch (failure) { setError(failure.message) }
    finally { setLoading(false) }
  }
  function openModal(value) { setModalError(''); setModal(value) }
  function saved(item, editing) {
    setProducts((items) => editing ? items.map((existing) => existing.id === item.id ? item : existing) : [item, ...items])
    setModal(null); setToast(editing ? 'Product updated successfully.' : 'Product added to your inventory.'); setPage(1)
  }
  async function remove() {
    setBusy(true); setModalError('')
    try { await api.deleteProduct(modal.product.id); setProducts((items) => items.filter((item) => item.id !== modal.product.id)); setModal(null); setToast('Product deleted successfully.') }
    catch (failure) { setModalError(failure.message); if (failure.status === 404) await reload() }
    finally { setBusy(false) }
  }
  async function logout() {
    setBusy(true); setModalError('')
    try { await api.logout(); onLogout() }
    catch (failure) { setModalError(failure.message) }
    finally { setBusy(false) }
  }
  const counts = { all: products.length, available: products.filter((p) => p.quantity > 10).length, low: products.filter((p) => p.quantity > 0 && p.quantity <= 10).length, out: products.filter((p) => p.quantity === 0).length }
  const units = products.reduce((total, item) => total + item.quantity, 0)
  const value = products.reduce((total, item) => total + Number(item.price) * item.quantity, 0)
  const filtered = products.filter((item) => {
    const match = `${item.product_name} ${item.description} ${item.id}`.toLowerCase().includes(query.toLowerCase())
    return match && (filter === 'all' || filter === 'available' && item.quantity > 10 || filter === 'low' && item.quantity > 0 && item.quantity <= 10 || filter === 'out' && item.quantity === 0)
  }).sort((a, b) => sort === 'name' ? a.product_name.localeCompare(b.product_name) : sort === 'price' ? Number(b.price) - Number(a.price) : sort === 'stock' ? a.quantity - b.quantity : b.id - a.id)
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6))
  const currentPage = Math.min(page, pageCount)
  const items = filtered.slice((currentPage - 1) * 6, currentPage * 6)
  const applyFilter = (next) => { setFilter(next); setPage(1) }
  return <div className="app-shell">
    <aside className="glass sidebar">
      <a className="brand" href="#" onClick={() => { applyFilter('all'); setQuery('') }}><span className="brand-mark"><Icon name="box" size={24}/></span><span>arciaga<span className="brand-caption">INVENTORY STUDIO</span></span></a>
      <p className="nav-label">WORKSPACE</p><nav aria-label="Main navigation"><button className={`nav-item ${filter === 'all' ? 'active' : ''}`} onClick={() => applyFilter('all')}><Icon name="grid"/> All products <span>{counts.all}</span></button><button className={`nav-item ${filter === 'low' ? 'active' : ''}`} onClick={() => applyFilter('low')}><Icon name="warning"/> Low stock <span>{counts.low}</span></button><button className={`nav-item ${filter === 'out' ? 'active' : ''}`} onClick={() => applyFilter('out')}><Icon name="box"/> Out of stock <span>{counts.out}</span></button></nav>
      <div className="sidebar-note"><div className="note-icon"><Icon name="trend"/></div><h3>A little more clarity.</h3><p>Keep your stock up to date, one product at a time.</p><button onClick={() => openModal({ type: 'help' })}>Workspace guide <Icon name="arrow" size={16}/></button></div>
      <div className="sidebar-bottom"><button className="nav-item" onClick={() => openModal({ type: 'help' })}><Icon name="help"/> Help & details</button><button className="nav-item" onClick={() => openModal({ type: 'logout' })}><Icon name="logout"/> Sign out</button><div className="profile"><span className="avatar">{user.username.slice(0, 2).toUpperCase()}</span><div><strong>{user.username}</strong><span>Workspace member</span></div><span className="online-dot" title="Signed in"/></div></div>
    </aside>
    <main className="workspace">
      <header className="workspace-header"><div><p className="eyebrow">YOUR EVERYDAY WORKSPACE</p><h1>Inventory, in focus<span className="accent">.</span></h1><p className="muted">Welcome back, {user.username}. Here’s where things stand.</p></div><div className="header-right"><span className="date-pill">{new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span><button className="button primary" onClick={() => openModal({ type: 'add' })}><Icon name="plus"/> Add product</button></div></header>
      <section className="stats-grid" aria-label="Inventory summary"><Stat icon="box" label="Total products" value={loading && !products.length ? '—' : integer.format(products.length)} note="Different products in your catalog" tone="purple"/><Stat icon="grid" label="Units in stock" value={loading && !products.length ? '—' : integer.format(units)} note="Available across your inventory" tone="blue"/><Stat icon="trend" label="Inventory value" value={loading && !products.length ? '—' : money.format(value)} note="Unit price × quantity on hand" tone="mint"/><Stat icon="warning" label="Needs attention" value={loading && !products.length ? '—' : integer.format(counts.low + counts.out)} note={`${counts.low} low stock · ${counts.out} out of stock`} tone="peach"/></section>
      <section className="glass catalog" aria-labelledby="catalog-heading"><div className="catalog-heading"><div><p className="eyebrow">A PLACE FOR EVERY PRODUCT</p><h2 id="catalog-heading">Your product collection <span className="count-pill">{counts.all}</span></h2></div><button className="icon-button refresh-button" aria-label="Refresh products" onClick={reload} disabled={loading}><Icon name="refresh"/></button></div>
        <div className="catalog-toolbar"><div className="filter-tabs" aria-label="Filter products">{[['all', 'All products'], ['available', 'In stock'], ['low', 'Low stock'], ['out', 'Out of stock']].map(([key, label]) => <button key={key} className={filter === key ? 'selected' : ''} aria-pressed={filter === key} onClick={() => applyFilter(key)}>{label}<span>{counts[key]}</span></button>)}</div><div className="table-controls"><div className="input-icon search-input"><Icon name="search" size={18}/><input aria-label="Search products" placeholder="Search your products…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }}/></div><select aria-label="Sort products" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}><option value="newest">Newest first</option><option value="name">Name A–Z</option><option value="price">Price high–low</option><option value="stock">Stock low–high</option></select></div></div>
        {error && <div className="alert error catalog-error" role="alert"><Icon name="warning"/><span>{error}</span><button className="text-button" onClick={reload}>Retry</button></div>}
        <p className="table-scroll-hint">Swipe across the table to see stock and actions.</p>
        <div className="table-wrap" role="region" aria-label="Product table" tabIndex={0} aria-busy={loading}><table><thead><tr><th scope="col">Product</th><th scope="col">Unit price</th><th scope="col">Quantity</th><th scope="col">Stock status</th><th scope="col">Date added</th><th scope="col" className="actions-heading">Actions</th></tr></thead><tbody>
          {loading ? Array.from({ length: 4 }, (_, index) => <tr key={index} className="skeleton-row"><td colSpan={6}><span className="skeleton"/></td></tr>) : items.map((item) => <tr key={item.id}><td><div className="product-cell"><span className={`product-avatar color-${item.id % 4}`}><Icon name="box" size={23}/></span><div><strong>{item.product_name}</strong><p title={item.description}>{item.description || 'No description added'}</p><span className="product-id">PRD-{String(item.id).padStart(4, '0')}</span></div></div></td><td className="price-cell">{money.format(Number(item.price))}</td><td><span className="quantity">{integer.format(item.quantity)}</span><span className="quantity-unit"> units</span></td><td><span className={`badge ${statusClass(item.quantity)}`}><span className="dot"/>{statusFor(item.quantity)}</span></td><td className="date-cell">{dateFor(item.created_at)}</td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${item.product_name}`} onClick={() => openModal({ type: 'edit', product: item })}><Icon name="edit" size={18}/></button><button className="icon-button delete-button" aria-label={`Delete ${item.product_name}`} onClick={() => openModal({ type: 'delete', product: item })}><Icon name="trash" size={18}/></button></div></td></tr>)}
        </tbody></table></div>
        {!loading && !items.length && <div className="empty-state"><span className="empty-icon"><Icon name={query ? 'search' : 'box'} size={32}/></span><h3>{error ? 'Your products are taking a moment.' : query || filter !== 'all' ? 'No products match this view.' : 'Make room for your first product.'}</h3><p>{error ? 'Retry the connection to load your collection.' : query || filter !== 'all' ? 'Try another search or stock filter.' : 'Add a product and start bringing your inventory into focus.'}</p>{!error && <button className="button secondary" onClick={() => { if (query || filter !== 'all') { setQuery(''); applyFilter('all') } else openModal({ type: 'add' }) }}>{query || filter !== 'all' ? 'Clear filters' : 'Add your first product'}</button>}</div>}
        <footer className="catalog-footer"><span>{filtered.length ? `Showing ${(currentPage - 1) * 6 + 1}–${Math.min(currentPage * 6, filtered.length)} of ${filtered.length} products` : '0 products in this view'}</span><div className="pagination"><button className="icon-button" aria-label="Previous page" disabled={currentPage <= 1 || loading} onClick={() => setPage(currentPage - 1)}><Icon name="chevron" className="rotate" size={17}/></button><span>Page {currentPage} of {pageCount}</span><button className="icon-button" aria-label="Next page" disabled={currentPage >= pageCount || loading} onClick={() => setPage(currentPage + 1)}><Icon name="chevron" size={17}/></button></div></footer>
      </section>
      <footer className="workspace-footer"><span><span className="dot"/> Your inventory. A clearer perspective.</span><span>Arciaga Inventory Studio</span></footer>
    </main>
    {toast && <div className="glass toast" role="status"><span className="toast-icon"><Icon name="check"/></span>{toast}<button className="icon-button" onClick={() => setToast('')} aria-label="Dismiss notification"><Icon name="close" size={16}/></button></div>}
    {(modal?.type === 'add' || modal?.type === 'edit') && <ProductForm product={modal.product} onClose={() => setModal(null)} onSaved={saved}/>}
    {modal?.type === 'delete' && <Modal title="Delete this product?" subtitle="This action permanently removes it from your inventory." onClose={() => setModal(null)} busy={busy} className="confirm-modal"><div className="delete-summary"><span className="danger-icon"><Icon name="trash" size={26}/></span><div><strong>{modal.product.product_name}</strong><p>{money.format(Number(modal.product.price))} · {integer.format(modal.product.quantity)} units</p></div></div>{modalError && <div className="alert error" role="alert">{modalError}</div>}<div className="modal-actions"><button className="button secondary" disabled={busy} onClick={() => setModal(null)}>Keep product</button><button className="button danger" disabled={busy} onClick={remove}>{busy ? <span className="spinner"/> : <Icon name="trash" size={18}/>} {busy ? 'Deleting…' : 'Delete product'}</button></div></Modal>}
    {modal?.type === 'logout' && <Modal title="Ready to sign out?" subtitle="Your saved products will be here when you return." onClose={() => setModal(null)} busy={busy} className="confirm-modal">{modalError && <div className="alert error" role="alert">{modalError}</div>}<div className="modal-actions"><button className="button secondary" disabled={busy} onClick={() => setModal(null)}>Stay here</button><button className="button primary" disabled={busy} onClick={logout}>{busy ? <span className="spinner"/> : <Icon name="logout"/>} {busy ? 'Signing out…' : 'Sign out'}</button></div></Modal>}
    {modal?.type === 'help' && <Modal title="Your workspace guide" subtitle="A few essentials for a calmer inventory." onClose={() => setModal(null)}><div className="help-list"><div><Icon name="plus"/><p><strong>Add, edit, and organize.</strong><span>Give each product a name, description, price in Philippine pesos, and whole-number quantity.</span></p></div><div><Icon name="warning"/><p><strong>Keep an eye on stock.</strong><span>1–10 units means low stock. Zero means out of stock. More than 10 means in stock.</span></p></div><div><Icon name="search"/><p><strong>Find what you need.</strong><span>Search by product name, description, or numeric ID. Use the tabs and sort menu to narrow your view.</span></p></div><div><Icon name="lock"/><p><strong>A workspace for signed-in users.</strong><span>You’re signed in as {user.username} ({user.email}). Sign out when you’re finished on a shared computer.</span></p></div></div><div className="modal-actions"><button className="button primary" onClick={() => setModal(null)}>Got it <Icon name="check"/></button></div></Modal>}
  </div>
}
function Stat({ icon, label, value, note, tone }) {
  return <article className="glass stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon name={icon}/></span></div><strong className={`stat-value ${label === 'Inventory value' ? 'money-value' : ''}`}>{value}</strong><p>{note}</p></article>
}
