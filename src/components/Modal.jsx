import { useEffect, useRef } from 'react'
import Icon from './Icon'
export default function Modal({ title, subtitle, children, onClose, busy = false, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => { dialog.close() }
  }, [])
  return <dialog ref={ref} className={`glass modal ${className}`} aria-labelledby="modal-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
    onClick={(event) => { if (event.target === event.currentTarget && !busy) { const r = ref.current.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose() } }}>
    <div className="modal-heading"><div><p className="eyebrow">ARCIAGA INVENTORY</p><h2 id="modal-title">{title}</h2>{subtitle && <p className="muted">{subtitle}</p>}</div><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={busy}><Icon name="close"/></button></div>
    {children}
  </dialog>
}
