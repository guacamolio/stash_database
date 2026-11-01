//pievienot vai mainīt produktu, kvantitāte tiek pārveidota no html uz ciparu ar number() lai nesūta serverim string kad vinš gaida ciparu
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { PRODUCT_STATUS_LV } from '../labels.js';
import FormError from '../components/FormError.jsx';

export default function ProductForm() {
  const { id } = useParams();
  const edit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState({ sku: '', name: '', quantity: '0', status: 'in_stock' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (edit) api(`/products/${id}`).then((p) => setForm({ sku: p.sku, name: p.name, quantity: String(p.quantity), status: p.status })).catch(setError);
  }, [edit, id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (form.quantity.trim() === '') return setError(new Error('Ievadiet daudzumu'));
    setBusy(true);
    try {
      await api(edit ? `/products/${id}` : '/products', {
        method: edit ? 'PUT' : 'POST',
        body: { sku: form.sku.trim(), name: form.name.trim(), quantity: Number(form.quantity), status: form.status },
      });
      navigate('/products');
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <>
      <h2>{edit ? 'Rediģēt preci' : 'Pievienot produktu'}</h2>
      <form className="card wide" onSubmit={submit} noValidate>
        <label>Artikuls (SKU)<input value={form.sku} onChange={set('sku')} maxLength={40} /></label>
        <label>Nosaukums<input value={form.name} onChange={set('name')} maxLength={100} /></label>
        <label>Daudzums<input type="number" min="0" max="1000000" step="1" value={form.quantity} onChange={set('quantity')} /></label>
        <label>Stāvoklis
          <select value={form.status} onChange={set('status')}>
            {Object.entries(PRODUCT_STATUS_LV).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <FormError error={error} />
        <div className="actions">
          <button type="submit" disabled={busy}>Saglabāt</button>
          <Link className="btn ghost" to="/products">Atcelt</Link>
        </div>
      </form>
    </>
  );
}
