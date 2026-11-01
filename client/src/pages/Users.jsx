import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LV } from '../labels.js';
import FormError from '../components/FormError.jsx';

export default function Users() {
  const { user: me, can } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(() => api('/users').then(setUsers).catch(setError), []);
  useEffect(() => { load(); }, [load]);

  async function remove(u) {
    if (!window.confirm(`Dzēst lietotāju "${u.username}"?`)) return;
    setError(null);
    try { await api(`/users/${u.id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e); }
  }

  return (
    <>
      <div className="page-head">
        <h2>Lietotāji</h2>
        {can('user:create') && <Link className="btn" to="/users/new">+ Pievienot lietotāju</Link>}
      </div>
      <FormError error={error} />
      <table>
        <thead><tr><th>ID</th><th>Lietotājvārds</th><th>Loma</th><th>Izveidots</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td><td>{u.username}{u.id === me.id && ' (jūs)'}</td><td>{ROLE_LV[u.role]}</td><td>{u.created_at}</td>
              <td className="actions">
                {can('user:update') && <Link className="btn sm" to={`/users/${u.id}/edit`}>Rediģēt</Link>}
                {can('user:delete') && u.id !== me.id && <button className="btn sm danger" onClick={() => remove(u)}>Dzēst</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
