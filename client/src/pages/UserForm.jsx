import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { ROLE_LV } from '../labels.js';
import FormError from '../components/FormError.jsx';

export default function UserForm() {
  const { id } = useParams();
  const edit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', role: 'worker' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (edit) api(`/users/${id}`).then((u) => setForm({ username: u.username, password: '', role: u.role })).catch(setError);
  }, [edit, id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const body = { username: form.username.trim(), role: form.role };
    if (!edit || form.password) body.password = form.password;
    setBusy(true);
    try {
      await api(edit ? `/users/${id}` : '/users', { method: edit ? 'PUT' : 'POST', body });
      navigate('/users');
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <>
      <h2>{edit ? 'Rediģēt lietotāju' : 'Pievienot lietotāju'}</h2>
      <form className="card wide" onSubmit={submit} noValidate>
        <label>Lietotājvārds
          <input value={form.username} onChange={set('username')} maxLength={30} required />
        </label>
        <label>{edit ? 'Jauna parole (atstājiet tukšu, lai nemainītu)' : 'Parole'}
          <input type="password" value={form.password} onChange={set('password')} maxLength={100} autoComplete="new-password" />
          <small>Vismaz 8 simboli, burts un cipars.</small>
        </label>
        <label>Loma
          <select value={form.role} onChange={set('role')}>
            {Object.entries(ROLE_LV).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <FormError error={error} />
        <div className="actions">
          <button type="submit" disabled={busy}>Saglabāt</button>
          <Link className="btn ghost" to="/users">Atcelt</Link>
        </div>
      </form>
    </>
  );
}
