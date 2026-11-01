import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// One menu for everyone; each item shows only if the user has its permission.
export const MENU = [
  { to: '/', label: 'Sākums', end: true },
  { to: '/products/new', label: 'Pievienot produktu', permission: 'product:create' },
  { to: '/users/new', label: 'Pievienot lietotāju', permission: 'user:create' },
  { to: '/users', label: 'Lietotāji', permission: 'user:read' },
  { to: '/products', label: 'Preces', permission: 'product:read', end: true },
  { to: '/locations', label: 'Atrašanās vietas', permission: 'location:manage' },
  { to: '/orders/new', label: 'Veikt pasūtījumu', permission: 'order:create' },
  { to: '/orders', label: 'Pasūtījumi', permission: 'order:read', end: true },
  { to: '/placement', label: 'Izvietot preces', permission: 'placement:write' },
  { to: '/data-entry', label: 'Datu ievade', permission: 'placement:write' },
  { to: '/reports', label: 'Sagatavot atskaiti', permission: 'report:read' },
];

export default function Sidebar() {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();

  const items = MENU.filter((m) => !m.permission || can(m.permission));

  return (
    <aside className="sidebar">
      <h1 className="logo">STASH</h1>
      <nav>
        {items.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end}>{m.label}</NavLink>
        ))}
        <button onClick={async () => { await logout(); navigate('/login'); }}>Iziet</button>
      </nav>
      <p className="who">{user.username} · {user.role}</p>
    </aside>
  );
}
