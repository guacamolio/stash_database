//noliek produktus plauktā burtiski un highlighto duplikātus
import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import { PRODUCT_STATUS_LV } from '../labels.js';
import FormError from '../components/FormError.jsx';

const EMPTY = { product_id: '', shelf: '', row: '', slot: '' };
export default function Placement() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => api('/placement').then(setItems).catch(setError), []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function pick(p) {
    const [shelf = '', row = '', slot = ''] = p.location ? p.location.split('-') : [];
    setForm({ product_id: String(p.id), shelf, row, slot });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e) {
    e.preventDefault();
    setError(null); setMsg('');
    if (!form.product_id) return setError(new Error('Izvēlieties preci'));
    if (!form.shelf.trim() || !form.row || !form.slot) return setError(new Error('Aizpildiet plauktu, rindu un vietu'));
    try {
      const r = await api('/placement', { method: 'POST', body: {
        product_id: Number(form.product_id), shelf: form.shelf.trim(), row: Number(form.row), slot: Number(form.slot),
      } });
      setMsg(`Saglabāts: ${r.location}`);
      setForm(EMPTY); load();
    } catch (err) { setError(err); }
  }

  async function unplace(p) {
    if (!window.confirm(`Noņemt izvietojumu precei "${p.name}"?`)) return;
    setError(null);
    try { await api(`/placement/${p.id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e); }
  }

  return (
    <>
      <h2>Izvietot preces</h2>
      <form className="card wide" onSubmit={submit} noValidate>
        <label>Prece
          <select value={form.product_id} onChange={set('product_id')}>
            <option value="">— izvēlieties —</option>
            {items.map((p) => <option key={p.id} value={p.id}>{p.sku} – {p.name}</option>)}
          </select>
        </label>
        <div className="line">
          <label>Plaukts<input value={form.shelf} onChange={set('shelf')} maxLength={10} placeholder="A" /></label>
          <label>Rinda<input type="number" min="1" max="99" value={form.row} onChange={set('row')} /></label>
          <label>Vieta<input type="number" min="1" max="99" value={form.slot} onChange={set('slot')} /></label>
        </div>
        <FormError error={error} />
        {msg && <p className="ok">{msg}</p>}
        <div className="actions"><button type="submit">Saglabāt izvietojumu</button></div>
      </form>

      <table>
        <thead><tr><th>Artikuls</th><th>Nosaukums</th><th>Stāvoklis</th><th>Atrašanās vieta</th><th>Atjaunināts</th><th></th></tr></thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className={p.location ? '' : 'unplaced'}>
              <td>{p.sku}</td><td>{p.name}</td><td>{PRODUCT_STATUS_LV[p.status]}</td>
              <td>{p.location ?? 'Nav izvietota'}</td><td>{p.updated_at ?? '—'}</td>
              <td className="actions">
                <button className="btn sm" onClick={() => pick(p)}>{p.location ? 'Mainīt' : 'Izvietot'}</button>
                {p.location && <button className="btn sm danger" onClick={() => unplace(p)}>Noņemt</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
