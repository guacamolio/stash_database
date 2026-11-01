//Login forma sākumā navigate pārbauda vai esi logged ar hook jo react vajag lai hook strādā vienādā secībā vienmēr 
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) return setError('Aizpildiet abus laukus');
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card" onSubmit={onSubmit} noValidate>
        <h1 className="logo dark">STASH</h1>
        <label>Lietotājvārds
          <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={50} autoComplete="username" autoFocus />
        </label>
        <label>Parole
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={200} autoComplete="current-password" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Pieslēdzas…' : 'Pieslēgties'}</button>
      </form>
    </div>
  );
}
