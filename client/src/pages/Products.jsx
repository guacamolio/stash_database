import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PRODUCT_STATUS_LV } from '../labels.js';
import FormError from '../components/FormError.jsx';

export default function Products() {
  const { can } = useAuth();
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api(`/products?q=${encodeURIComponent(q)}`).then(setProducts).catch(setError);
  }, [q]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  async function remove(p) {
    if (!window.confirm(`Dzēst preci "${p.name}"?`)) return;
    setError(null);
    try { await api(`/products/${p.id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e); }
  }

  return (
    <>
      <div className="page-head">
        <h2>Preces</h2>
        {can('product:create') && <Link className="btn" to="/products/new">+ Pievienot produktu</Link>}
      </div>
      <input className="search" placeholder="Meklēt pēc nosaukuma vai artikula…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={100} />
      <FormError error={error} />
      <table>
        <thead><tr><th>Artikuls</th><th>Nosaukums</th><th>Daudzums</th><th>Stāvoklis</th><th>Atrašanās vieta</th><th></th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.sku}</td><td>{p.name}</td>
              <td className={p.quantity < 10 ? 'low' : ''}>{p.quantity}</td>
              <td>{PRODUCT_STATUS_LV[p.status]}</td><td>{p.location ?? '—'}</td>
              <td className="actions">
                {can('product:update') && <Link className="btn sm" to={`/products/${p.id}/edit`}>Rediģēt</Link>}
                {can('product:delete') && <button className="btn sm danger" onClick={() => remove(p)}>Dzēst</button>}
              </td>
            </tr>
          ))}
          {products.length === 0 && <tr><td colSpan="6">Nav preču.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
