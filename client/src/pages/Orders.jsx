//pasūtijumi un viņu status
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ORDER_STATUS_LV, ORDER_NEXT, NEXT_LABEL } from '../labels.js';
import FormError from '../components/FormError.jsx';

export default function Orders() {
  const { can } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(() => api('/orders').then(setOrders).catch(setError), []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(o, status) {
    if (status === 'cancelled' && !window.confirm(`Atcelt pasūtījumu #${o.id}? Krājumi tiks atgriezti.`)) return;
    setError(null);
    try { await api(`/orders/${o.id}/status`, { method: 'PATCH', body: { status } }); load(); } catch (e) { setError(e); }
  }

  return (
    <>
      <div className="page-head">
        <h2>Pasūtījumi</h2>
        {can('order:create') && <Link className="btn" to="/orders/new">+ Veikt pasūtījumu</Link>}
      </div>
      <FormError error={error} />
      <table>
        <thead><tr><th>Nr.</th><th>Statuss</th><th>Preces</th><th>Izveidoja</th><th>Izveidots</th><th></th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td><span className={`badge ${o.status}`}>{ORDER_STATUS_LV[o.status]}</span></td>
              <td>{o.items}</td><td>{o.created_by ?? '—'}</td><td>{o.created_at}</td>
              <td className="actions">
                {can('order:update_status') && ORDER_NEXT[o.status].map((s) => (
                  <button key={s} className={`btn sm ${s === 'cancelled' ? 'danger' : ''}`} onClick={() => setStatus(o, s)}>{NEXT_LABEL[s]}</button>
                ))}
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan="6">Nav pasūtījumu.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
