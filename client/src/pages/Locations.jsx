//adminu plauktu managerment
import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import FormError from '../components/FormError.jsx';

export default function Locations() {
  const [locs, setLocs] = useState([]);
  const [form, setForm] = useState({ shelf: '', row: '', slot: '' });
  const [error, setError] = useState(null);

  const load = useCallback(() => api('/locations').then(setLocs).catch(setError), []);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function add(e) {
    e.preventDefault();
    setError(null);
    if (!form.shelf.trim() || !form.row || !form.slot) return setError(new Error('Aizpildiet visus laukus'));
    try {
      await api('/locations', { method: 'POST', body: { shelf: form.shelf.trim(), row: Number(form.row), slot: Number(form.slot) } });
      setForm({ shelf: '', row: '', slot: '' }); load();
    } catch (err) { setError(err); }
  }

  async function remove(l) {
    if (!window.confirm(`Dzēst vietu ${l.shelf}-${l.row}-${l.slot}?`)) return;
    setError(null);
    try { await api(`/locations/${l.id}`, { method: 'DELETE' }); load(); } catch (err) { setError(err); }
  }

  return (
    <>
      <h2>Atrašanās vietas</h2>
      <form className="card wide" onSubmit={add} noValidate>
        <div className="line">
          <label>Plaukts<input value={form.shelf} onChange={set('shelf')} maxLength={10} placeholder="A" /></label>
          <label>Rinda<input type="number" min="1" max="99" value={form.row} onChange={set('row')} /></label>
          <label>Vieta<input type="number" min="1" max="99" value={form.slot} onChange={set('slot')} /></label>
        </div>
        <FormError error={error} />
        <div className="actions"><button type="submit">+ Pievienot vietu</button></div>
      </form>
      <table>
        <thead><tr><th>Vieta</th><th>Aizņemta ar</th><th></th></tr></thead>
        <tbody>
          {locs.map((l) => (
            <tr key={l.id}>
              <td>{l.shelf}-{l.row}-{l.slot}</td><td>{l.product ?? 'Brīva'}</td>
              <td className="actions"><button className="btn sm danger" onClick={() => remove(l)}>Dzēst</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
