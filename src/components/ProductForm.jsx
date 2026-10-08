import { useState } from 'react'
import Modal from './Modal'
import Icon from './Icon'
import { api } from '../lib/api'
export default function ProductForm({ product, onClose, onSaved }) {
  const [values, setValues] = useState({ product_name: product?.product_name || '', description: product?.description || '', price: product?.price ?? '', quantity: product?.quantity ?? '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const change = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }
  async function submit(event) {
    event.preventDefault()
    const issues = {}
    if (!values.product_name.trim() || values.product_name.length > 100) issues.product_name = 'Enter a name of 1 to 100 characters.'
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(values.price))) issues.price = 'Enter a valid price with up to two decimal places.'
    if (!/^\d{1,10}$/.test(String(values.quantity)) || Number(values.quantity) > 2147483647) issues.quantity = 'Enter a whole, nonnegative quantity.'
    if (new TextEncoder().encode(values.description).length > 10000) issues.description = 'Keep your description under 10,000 bytes.'
    if (Object.keys(issues).length) { setErrors(issues); return }
    setBusy(true); setError(''); setErrors({})
    try {
      const item = product ? await api.updateProduct(product.id, values) : await api.createProduct(values)
      onSaved(item, Boolean(product))
    } catch (failure) { setError(failure.message); setErrors(failure.errors || {}) }
    finally { setBusy(false) }
  }
  return <Modal title={product ? 'Edit product' : 'Add a product'} subtitle={product ? 'Update the details and keep your inventory accurate.' : 'A new addition to your inventory starts here.'} onClose={onClose} busy={busy}>
    <form onSubmit={submit} noValidate>
      {error && <div role="alert" className="alert error"><Icon name="warning"/><span>{error}</span></div>}
      <label htmlFor="product-name">Product name <span className="required">*</span></label>
      <input autoFocus id="product-name" name="product_name" value={values.product_name} onChange={change} maxLength={100} placeholder="e.g. Wireless keyboard" disabled={busy} aria-invalid={Boolean(errors.product_name)} aria-describedby={errors.product_name ? 'name-error' : undefined}/>
      {errors.product_name && <p id="name-error" className="field-error">{errors.product_name}</p>}
      <label htmlFor="description">Description <span className="optional">Optional</span></label>
      <textarea id="description" name="description" value={values.description} onChange={change} rows={3} maxLength={10000} placeholder="A few useful details about this product…" disabled={busy} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : undefined}/>
      {errors.description && <p id="description-error" className="field-error">{errors.description}</p>}
      <div className="form-grid"><div><label htmlFor="price">Price (PHP) <span className="required">*</span></label><input id="price" name="price" type="number" min="0" max="99999999.99" step="0.01" value={values.price} onChange={change} placeholder="0.00" disabled={busy} aria-invalid={Boolean(errors.price)} aria-describedby={errors.price ? 'price-error' : undefined}/>{errors.price && <p id="price-error" className="field-error">{errors.price}</p>}</div>
      <div><label htmlFor="quantity">Quantity <span className="required">*</span></label><input id="quantity" name="quantity" type="number" min="0" max="2147483647" step="1" value={values.quantity} onChange={change} placeholder="0" disabled={busy} aria-invalid={Boolean(errors.quantity)} aria-describedby={errors.quantity ? 'quantity-error' : undefined}/>{errors.quantity && <p id="quantity-error" className="field-error">{errors.quantity}</p>}</div></div>
      <div className="form-note"><Icon name="lock" size={16}/><span>Only signed-in users can manage products.</span></div>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="button primary" disabled={busy}>{busy ? <span className="spinner"/> : <Icon name={product ? 'check' : 'plus'}/>} {busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}</button></div>
    </form>
  </Modal>
}
