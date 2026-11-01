//updateo produkta stāvokli un samaina viņa statusu visur 
import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import { PRODUCT_STATUS_LV } from '../labels.js';
import FormError from '../components/FormError.jsx';

export default function DataEntry() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ product_id: '', status: 'in_stock' });
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    api('/placement').then(setProducts).catch(setError);
    api('/placement/history').then(setHistory).catch(setError);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError(null); setMsg('');
    if (!form.product_id) return setError(new Error('Izvēlieties preci'));
    try {
      await api(`/placement/${form.product_id}/condition`, { method: 'PATCH', body: { status: form.status } });
      setMsg('Stāvoklis atjaunināts'); load();
    } catch (err) { setError(err); }
  }

  const onProduct = (e) => {
    const p = products.find((x) => String(x.id) === e.target.value);
    setForm({ product_id: e.target.value, status: p?.status ?? 'in_stock' });
  };

  return (
    <>
      <h2>Datu ievade</h2>
      <form className="card wide" onSubmit={submit} noValidate>
        <label>Prece
          <select value={form.product_id} onChange={onProduct}>
            <option value="">— izvēlieties —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.sku} – {p.name} ({PRODUCT_STATUS_LV[p.status]})</option>)}
          </select>
        </label>
        <label>Jaunais stāvoklis
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {Object.entries(PRODUCT_STATUS_LV).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <FormError error={error} />
        {msg && <p className="ok">{msg}</p>}
        <div className="actions"><button type="submit">Atjaunināt stāvokli</button></div>
      </form>

      <h3>Veiktās izmaiņas</h3>
      <table>
        <thead><tr><th>Laiks</th><th>Lietotājs</th><th>Izmaiņa</th></tr></thead>
        <tbody>
          {history.map((h) => <tr key={h.id}><td>{h.timestamp}</td><td>{h.user ?? '(dzēsts)'}</td><td>{h.details}</td></tr>)}
          {history.length === 0 && <tr><td colSpan="3">Vēl nav izmaiņu.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
