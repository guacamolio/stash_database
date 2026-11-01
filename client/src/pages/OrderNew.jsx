import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';
import FormError from '../components/FormError.jsx';

export default function OrderNew() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([{ product_id: '', quantity: '1' }]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/products').then((all) => setProducts(all.filter((p) => p.status === 'in_stock' && p.quantity > 0))).catch(setError);
  }, []);

  const update = (i, patch) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const items = lines.map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) }));
    if (items.some((i) => !i.product_id)) return setError(new Error('Izvēlieties preci katrā rindā'));
    if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1)) return setError(new Error('Daudzumam jābūt veselam skaitlim, vismaz 1'));
    if (new Set(items.map((i) => i.product_id)).size !== items.length) return setError(new Error('Prece nedrīkst atkārtoties'));
    setBusy(true);
    try { await api('/orders', { method: 'POST', body: { items } }); navigate('/orders'); }
    catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <>
      <h2>Veikt pasūtījumu</h2>
      <form className="card wide" onSubmit={submit} noValidate>
        {lines.map((l, i) => {
          const p = products.find((x) => String(x.id) === l.product_id);
          return (
            <div className="line" key={i}>
              <select value={l.product_id} onChange={(e) => update(i, { product_id: e.target.value })}>
                <option value="">— izvēlieties preci —</option>
                {products.map((x) => <option key={x.id} value={x.id}>{x.sku} – {x.name} (pieejams {x.quantity})</option>)}
              </select>
              <input type="number" min="1" max={p?.quantity ?? 100000} step="1" value={l.quantity} onChange={(e) => update(i, { quantity: e.target.value })} />
              {lines.length > 1 && <button type="button" className="btn sm danger" onClick={() => setLines(lines.filter((_, idx) => idx !== i))}>✕</button>}
            </div>
          );
        })}
        <button type="button" className="btn ghost" onClick={() => setLines([...lines, { product_id: '', quantity: '1' }])}>+ Pievienot rindu</button>
        <FormError error={error} />
        <div className="actions">
          <button type="submit" disabled={busy}>Izveidot pasūtījumu</button>
          <Link className="btn ghost" to="/orders">Atcelt</Link>
        </div>
      </form>
    </>
  );
}
